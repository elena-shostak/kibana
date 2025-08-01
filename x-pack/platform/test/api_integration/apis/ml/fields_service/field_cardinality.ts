/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import { FtrProviderContext } from '../../../ftr_provider_context';
import { USER } from '../../../services/ml/security_common';
import { getCommonRequestHeader } from '../../../services/ml/common_api';

export default ({ getService }: FtrProviderContext) => {
  const esArchiver = getService('esArchiver');
  const supertest = getService('supertestWithoutAuth');
  const ml = getService('ml');

  const testDataList = [
    {
      testTitle: 'returns cardinality of customer name fields over full time range',
      user: USER.ML_POWERUSER,
      requestBody: {
        index: 'ft_ecommerce',
        fieldNames: ['customer_first_name.keyword', 'customer_last_name.keyword'],
        query: { bool: { must: [{ match_all: {} }] } },
        timeFieldName: 'order_date',
      },
      expected: {
        statusCode: 200,
        responseBody: {
          'customer_first_name.keyword': 46,
          'customer_last_name.keyword': 183,
        },
      },
    },
    {
      testTitle: 'returns cardinality of geoip fields over specified range',
      user: USER.ML_POWERUSER,
      requestBody: {
        index: 'ft_ecommerce',
        fieldNames: ['geoip.city_name', 'geoip.continent_name', 'geoip.country_iso_code'],
        query: { bool: { must: [{ match_all: {} }] } },
        timeFieldName: 'order_date',
        earliestMs: 1686787200000, // June 15, 2023 12:00:00 AM GMT
        latestMs: 1686873599000, //  June 15, 2023 11:59:59 PM GMT
      },
      expected: {
        statusCode: 200,
        responseBody: {
          'geoip.city_name': 10,
          'geoip.continent_name': 5,
          'geoip.country_iso_code': 9,
        },
      },
    },
    {
      testTitle: 'returns empty response for non aggregatable field',
      user: USER.ML_POWERUSER,
      requestBody: {
        index: 'ft_ecommerce',
        fieldNames: ['manufacturer'],
        query: { bool: { must: [{ match_all: {} }] } },
        timeFieldName: 'order_date',
        earliestMs: 1686787200000, // June 15, 2023 12:00:00 AM GMT
        latestMs: 1686873599000, //  June 15, 2023 11:59:59 PM GMT
      },
      expected: {
        statusCode: 200,
        responseBody: {},
      },
    },
    {
      testTitle: 'returns error for index which does not exist',
      user: USER.ML_POWERUSER,
      requestBody: {
        index: 'ft_ecommerce_not_exist',
        fieldNames: ['customer_first_name.keyword', 'customer_last_name.keyword'],
        timeFieldName: 'order_date',
      },
      expected: {
        statusCode: 404,
        responseBody: {
          error: 'Not Found',
          message: 'index_not_found_exception',
        },
      },
    },
  ];

  describe('field_cardinality', function () {
    before(async () => {
      await esArchiver.loadIfNeeded('x-pack/platform/test/fixtures/es_archives/ml/ecommerce');
      await ml.testResources.setKibanaTimeZoneToUTC();
    });

    for (const testData of testDataList) {
      it(`${testData.testTitle}`, async () => {
        const { body, status } = await supertest
          .post('/internal/ml/fields_service/field_cardinality')
          .auth(testData.user, ml.securityCommon.getPasswordForUser(testData.user))
          .set(getCommonRequestHeader('1'))
          .send(testData.requestBody);
        ml.api.assertResponseStatusCode(testData.expected.statusCode, status, body);

        if (body.error === undefined) {
          expect(body).to.eql(testData.expected.responseBody);
        } else {
          expect(body.error).to.eql(testData.expected.responseBody.error);
          expect(body.message).to.contain(testData.expected.responseBody.message);
        }
      });
    }
  });
};
