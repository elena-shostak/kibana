/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { RequestHandler } from '@kbn/core/server';
import { RouteDependencies } from '../../..';

interface SpecDefinitionsRouteResponse {
  es: {
    name: string;
    globals: Record<string, any>;
    endpoints: Record<string, any>;
  };
}

export const registerSpecDefinitionsRoute = ({ router, services }: RouteDependencies) => {
  const handler: RequestHandler = async (ctx, request, response) => {
    const specResponse: SpecDefinitionsRouteResponse = {
      es: services.specDefinitionService.asJson(),
    };

    return response.ok({
      body: specResponse,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  router.get(
    {
      path: '/api/console/api_server',
      security: {
        authz: {
          enabled: false,
          reason: 'Low effort request for config info',
        },
      },
      validate: false,
    },
    handler
  );
};
