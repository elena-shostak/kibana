/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { Spaces } from '../../scenarios';
import { getUrlPrefix, ObjectRemover } from '../../../common/lib';
import type { FtrProviderContext } from '../../../common/ftr_provider_context';

export default function getAllConnectorsTests({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');

  describe('getAll', () => {
    const objectRemover = new ObjectRemover(supertest);

    afterEach(() => objectRemover.removeAll());

    it('should handle get all connectors request appropriately', async () => {
      const { body: createdConnector } = await supertest
        .post(`${getUrlPrefix(Spaces.space1.id)}/api/actions/connector`)
        .set('kbn-xsrf', 'foo')
        .send({
          name: 'My connector',
          connector_type_id: 'test.index-record',
          config: {
            unencrypted: `This value shouldn't get encrypted`,
          },
          secrets: {
            encrypted: 'This value should be encrypted',
          },
        })
        .expect(200);
      objectRemover.add(Spaces.space1.id, createdConnector.id, 'connector', 'actions');

      const { body: connectors } = await supertest
        .get(`${getUrlPrefix(Spaces.space1.id)}/api/actions/connectors`)
        .expect(200);

      // the custom ssl connectors have dynamic ports, so remove them before
      // comparing to what we expect
      const nonCustomSslConnectors = connectors.filter(
        (conn: { id: string }) => !conn.id.startsWith('custom.ssl.')
      );

      expect(nonCustomSslConnectors).to.eql([
        {
          id: 'preconfigured-alert-history-es-index',
          name: 'Alert history Elasticsearch index',
          connector_type_id: '.index',
          is_preconfigured: true,
          is_deprecated: false,
          is_system_action: false,
          referenced_by_count: 0,
        },
        {
          id: createdConnector.id,
          is_preconfigured: false,
          is_deprecated: false,
          name: 'My connector',
          connector_type_id: 'test.index-record',
          is_missing_secrets: false,
          is_system_action: false,
          config: {
            unencrypted: `This value shouldn't get encrypted`,
          },
          referenced_by_count: 0,
        },
        {
          connector_type_id: '.email',
          id: 'notification-email',
          is_deprecated: false,
          is_preconfigured: true,
          is_system_action: false,
          name: 'Notification Email Connector',
          referenced_by_count: 0,
        },
        {
          id: 'preconfigured-es-index-action',
          is_preconfigured: true,
          is_deprecated: false,
          is_system_action: false,
          connector_type_id: '.index',
          name: 'preconfigured_es_index_action',
          referenced_by_count: 0,
        },
        {
          connector_type_id: '.servicenow',
          id: 'my-deprecated-servicenow',
          is_deprecated: true,
          is_preconfigured: true,
          is_system_action: false,
          name: 'ServiceNow#xyz',
          referenced_by_count: 0,
        },
        {
          connector_type_id: '.servicenow',
          id: 'my-deprecated-servicenow-default',
          is_preconfigured: true,
          is_deprecated: true,
          is_system_action: false,
          name: 'ServiceNow#xyz',
          referenced_by_count: 0,
        },
        {
          id: 'my-slack1',
          is_preconfigured: true,
          is_deprecated: false,
          connector_type_id: '.slack',
          is_system_action: false,
          name: 'Slack#xyz',
          referenced_by_count: 0,
        },
        {
          id: 'custom-system-abc-connector',
          is_preconfigured: true,
          is_deprecated: false,
          connector_type_id: 'system-abc-action-type',
          is_system_action: false,
          name: 'SystemABC',
          referenced_by_count: 0,
        },
        {
          id: 'preconfigured.test.index-record',
          is_preconfigured: true,
          is_deprecated: false,
          connector_type_id: 'test.index-record',
          is_system_action: false,
          name: 'Test:_Preconfigured_Index_Record',
          referenced_by_count: 0,
        },
        {
          id: 'my-test-email',
          is_preconfigured: true,
          is_deprecated: false,
          is_system_action: false,
          connector_type_id: '.email',
          name: 'TestEmail#xyz',
          referenced_by_count: 0,
        },
      ]);
    });

    it(`shouldn't get all connectors from another space`, async () => {
      const { body: createdConnector } = await supertest
        .post(`${getUrlPrefix(Spaces.space1.id)}/api/actions/connector`)
        .set('kbn-xsrf', 'foo')
        .send({
          name: 'My connector',
          connector_type_id: 'test.index-record',
          config: {
            unencrypted: `This value shouldn't get encrypted`,
          },
          secrets: {
            encrypted: 'This value should be encrypted',
          },
        })
        .expect(200);
      objectRemover.add(Spaces.space1.id, createdConnector.id, 'connector', 'actions');

      const { body: connectors } = await supertest
        .get(`${getUrlPrefix(Spaces.other.id)}/api/actions/connectors`)
        .expect(200);

      // the custom ssl connectors have dynamic ports, so remove them before
      // comparing to what we expect
      const nonCustomSslConnectors = connectors.filter(
        (conn: { id: string }) => !conn.id.startsWith('custom.ssl.')
      );

      expect(nonCustomSslConnectors).to.eql([
        {
          id: 'preconfigured-alert-history-es-index',
          name: 'Alert history Elasticsearch index',
          connector_type_id: '.index',
          is_preconfigured: true,
          is_deprecated: false,
          is_system_action: false,
          referenced_by_count: 0,
        },
        {
          connector_type_id: '.email',
          id: 'notification-email',
          is_deprecated: false,
          is_preconfigured: true,
          is_system_action: false,
          name: 'Notification Email Connector',
          referenced_by_count: 0,
        },
        {
          id: 'preconfigured-es-index-action',
          is_preconfigured: true,
          is_deprecated: false,
          is_system_action: false,
          connector_type_id: '.index',
          name: 'preconfigured_es_index_action',
          referenced_by_count: 0,
        },
        {
          connector_type_id: '.servicenow',
          id: 'my-deprecated-servicenow',
          is_deprecated: true,
          is_preconfigured: true,
          is_system_action: false,
          name: 'ServiceNow#xyz',
          referenced_by_count: 0,
        },
        {
          connector_type_id: '.servicenow',
          id: 'my-deprecated-servicenow-default',
          is_preconfigured: true,
          is_deprecated: true,
          is_system_action: false,
          name: 'ServiceNow#xyz',
          referenced_by_count: 0,
        },
        {
          id: 'my-slack1',
          is_preconfigured: true,
          is_deprecated: false,
          is_system_action: false,
          connector_type_id: '.slack',
          name: 'Slack#xyz',
          referenced_by_count: 0,
        },
        {
          id: 'custom-system-abc-connector',
          is_preconfigured: true,
          is_deprecated: false,
          is_system_action: false,
          connector_type_id: 'system-abc-action-type',
          name: 'SystemABC',
          referenced_by_count: 0,
        },
        {
          id: 'preconfigured.test.index-record',
          is_preconfigured: true,
          is_deprecated: false,
          is_system_action: false,
          connector_type_id: 'test.index-record',
          name: 'Test:_Preconfigured_Index_Record',
          referenced_by_count: 0,
        },
        {
          id: 'my-test-email',
          is_preconfigured: true,
          is_deprecated: false,
          is_system_action: false,
          connector_type_id: '.email',
          name: 'TestEmail#xyz',
          referenced_by_count: 0,
        },
      ]);
    });
  });
}
