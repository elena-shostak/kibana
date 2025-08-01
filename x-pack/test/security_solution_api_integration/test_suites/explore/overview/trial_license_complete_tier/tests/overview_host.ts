/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import {
  HostsQueries,
  HostsOverviewStrategyResponse,
} from '@kbn/security-solution-plugin/common/search_strategy';
import TestAgent from 'supertest/lib/agent';
import { SearchService } from '@kbn/ftr-common-functional-services';
import { FtrProviderContextWithSpaces } from '../../../../../ftr_provider_context_with_spaces';

export default function ({ getService }: FtrProviderContextWithSpaces) {
  const esArchiver = getService('esArchiver');
  const utils = getService('securitySolutionUtils');

  // Failing: See https://github.com/elastic/kibana/issues/218282
  describe.skip('Overview Host', () => {
    let supertest: TestAgent;
    let search: SearchService;
    describe('With auditbeat', () => {
      before(async () => {
        supertest = await utils.createSuperTest();
        search = await utils.createSearch();
        await esArchiver.load('x-pack/platform/test/fixtures/es_archives/auditbeat/overview');
      });
      after(
        async () =>
          await esArchiver.unload('x-pack/platform/test/fixtures/es_archives/auditbeat/overview')
      );

      const FROM = '2000-01-01T00:00:00.000Z';
      const TO = '3000-01-01T00:00:00.000Z';
      const expectedResult = {
        auditbeatAuditd: 2194,
        auditbeatFIM: 4,
        auditbeatLogin: 2810,
        auditbeatPackage: 3,
        auditbeatProcess: 7,
        auditbeatUser: 6,
        endgameDns: 1,
        endgameFile: 2,
        endgameImageLoad: 1,
        endgameNetwork: 4,
        endgameProcess: 2,
        endgameRegistry: 1,
        endgameSecurity: 4,
        filebeatSystemModule: 0,
        winlogbeatSecurity: 0,
        winlogbeatMWSysmonOperational: 0,
      };

      it('Make sure that we get OverviewHost data', async () => {
        const { overviewHost } = await search.send<HostsOverviewStrategyResponse>({
          supertest,
          options: {
            defaultIndex: ['auditbeat-*'],
            factoryQueryType: HostsQueries.overview,
            timerange: {
              interval: '12h',
              to: TO,
              from: FROM,
            },
            inspect: false,
          },
          strategy: 'securitySolutionSearchStrategy',
        });
        expect(overviewHost).to.eql(expectedResult);
      });
    });
  });
}
