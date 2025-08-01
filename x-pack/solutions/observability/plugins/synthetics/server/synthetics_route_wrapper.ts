/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { withApmSpan } from '@kbn/apm-data-access-plugin/server/utils/with_apm_span';
import { DEFAULT_SPACE_ID } from '@kbn/spaces-plugin/common';
import { isEmpty } from 'lodash';
import { isKibanaResponse } from '@kbn/core-http-server';
import { MonitorConfigRepository } from './services/monitor_config_repository';
import { syntheticsServiceApiKey } from './saved_objects/service_api_key';
import { isTestUser, SyntheticsEsClient } from './lib';
import { SYNTHETICS_INDEX_PATTERN } from '../common/constants';
import { checkIndicesReadPrivileges } from './synthetics_service/authentication/check_has_privilege';
import { SyntheticsRouteWrapper } from './routes/types';

export const syntheticsRouteWrapper: SyntheticsRouteWrapper = (
  syntheticsRoute,
  server,
  syntheticsMonitorClient
) => ({
  ...syntheticsRoute,
  options: {
    ...(syntheticsRoute.options ?? {}),
  },
  security: {
    authz: {
      requiredPrivileges: [
        'uptime-read',
        ...(syntheticsRoute.requiredPrivileges ?? []),
        ...(syntheticsRoute?.writeAccess ? ['uptime-write'] : []),
      ],
    },
  },
  handler: async (context, request, response) => {
    return withApmSpan('synthetics_route_handler', async () => {
      const { elasticsearch, savedObjects, uiSettings } = await context.core;

      const { client: esClient } = elasticsearch;
      const savedObjectsClient = savedObjects.getClient({
        includedHiddenTypes: [syntheticsServiceApiKey.name],
      });

      // specifically needed for the synthetics service api key generation
      server.authSavedObjectsClient = savedObjectsClient;

      const syntheticsEsClient = new SyntheticsEsClient(
        savedObjectsClient,
        esClient.asCurrentUser,
        {
          request,
          uiSettings,
          isDev: Boolean(server.isDev) && !isTestUser(server),
          heartbeatIndices: SYNTHETICS_INDEX_PATTERN,
        }
      );

      server.syntheticsEsClient = syntheticsEsClient;
      const encryptedSavedObjectsClient = server.encryptedSavedObjects.getClient();
      const monitorConfigRepository = new MonitorConfigRepository(
        savedObjectsClient,
        encryptedSavedObjectsClient
      );

      const spaceId = server.spaces?.spacesService.getSpaceId(request) ?? DEFAULT_SPACE_ID;

      try {
        const res = await syntheticsRoute.handler({
          syntheticsEsClient,
          savedObjectsClient,
          context,
          request,
          response,
          server,
          spaceId,
          syntheticsMonitorClient,
          monitorConfigRepository,
        });
        if (isKibanaResponse(res)) {
          return res;
        }

        const inspectData = await syntheticsEsClient.getInspectData(syntheticsRoute.path);

        if (Array.isArray(res)) {
          if (isEmpty(inspectData)) {
            return response.ok({
              body: res,
            });
          } else {
            return response.ok({
              body: {
                result: res,
                ...inspectData,
              },
            });
          }
        }

        return response.ok({
          body: {
            ...res,
            ...inspectData,
          },
        });
      } catch (e) {
        if (isKibanaResponse(e)) {
          return e;
        }
        if (e.statusCode === 403) {
          const privileges = await checkIndicesReadPrivileges(syntheticsEsClient);
          if (!privileges.has_all_requested) {
            return response.forbidden({
              body: {
                message:
                  'MissingIndicesPrivileges: You do not have permission to read from the synthetics-* indices. Please contact your administrator.',
              },
            });
          }
        } else if (e.statusCode >= 500) {
          server.logger.error(e);
        } else {
          server.logger.debug(e);
        }
        throw e;
      }
    });
  },
});
