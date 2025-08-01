/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { v4 as uuidv4 } from 'uuid';
import { dataGeneratorFactory } from '../../../detections_response/utils';
import { deleteAllRules, deleteAllAlerts } from '../../../../../common/utils/security_solution';
import {
  buildDocument,
  createAndSyncRuleAndAlertsFactory,
  waitForRiskScoresToBePresent,
  riskEngineRouteHelpersFactory,
  getRiskEngineStats,
  areRiskScoreIndicesEmpty,
} from '../../utils';
import { FtrProviderContext } from '../../../../ftr_provider_context';

export default ({ getService }: FtrProviderContext) => {
  const supertest = getService('supertest');
  const esArchiver = getService('esArchiver');
  const log = getService('log');
  const retry = getService('retry');
  const es = getService('es');
  const createAndSyncRuleAndAlerts = createAndSyncRuleAndAlertsFactory({ supertest, log });
  const riskEngineRoutes = riskEngineRouteHelpersFactory(supertest);

  describe('@ess @serverless telemetry', () => {
    const { indexListOfDocuments } = dataGeneratorFactory({
      es,
      index: 'ecs_compliant',
      log,
    });

    before(async () => {
      await riskEngineRoutes.cleanUp();
      await esArchiver.load(
        'x-pack/solutions/security/test/fixtures/es_archives/security_solution/ecs_compliant'
      );
    });

    after(async () => {
      await esArchiver.unload(
        'x-pack/solutions/security/test/fixtures/es_archives/security_solution/ecs_compliant'
      );
      await deleteAllAlerts(supertest, log, es);
      await deleteAllRules(supertest, log);
    });

    beforeEach(async () => {
      await deleteAllAlerts(supertest, log, es);
      await deleteAllRules(supertest, log);
    });

    afterEach(async () => {
      await riskEngineRoutes.cleanUp();
    });

    it('should return empty metrics when the risk engine is disabled', async () => {
      await retry.try(async () => {
        const stats = await getRiskEngineStats(supertest, log);
        expect(stats).to.eql({});
      });
    });

    it('@skipInServerlessMKI should return metrics with expected values when risk engine is enabled', async () => {
      expect(await areRiskScoreIndicesEmpty({ log, es })).to.be(true);

      const serviceId = uuidv4();
      const serviceDocs = Array(10)
        .fill(buildDocument({}, serviceId))
        .map((event, index) => ({
          ...event,
          'service.name': `service-${index}`,
        }));

      const hostId = uuidv4();
      const hostDocs = Array(10)
        .fill(buildDocument({}, hostId))
        .map((event, index) => ({
          ...event,
          'host.name': `host-${index}`,
        }));

      const userId = uuidv4();
      const userDocs = Array(10)
        .fill(buildDocument({}, userId))
        .map((event, index) => ({
          ...event,
          'user.name': `user-${index}`,
        }));

      await indexListOfDocuments([...hostDocs, ...userDocs, ...serviceDocs]); // , ...serviceDocs

      await createAndSyncRuleAndAlerts({
        query: `id: ${userId} or id: ${hostId} or id: ${serviceId}`, //
        alerts: 30,
        riskScore: 40,
      });

      await riskEngineRoutes.init();

      await waitForRiskScoresToBePresent({ es, log, scoreCount: 30 });

      await retry.try(async () => {
        const {
          all_risk_scores_index_size: allRiskScoreIndexSize,
          unique_risk_scores_index_size: uniqueRiskScoreIndexSize,
          ...otherStats
        } = await getRiskEngineStats(supertest, log);
        const expected = {
          unique_host_risk_score_total: 10,
          unique_user_risk_score_total: 10,
          unique_user_risk_score_day: 10,
          unique_host_risk_score_day: 10,
          all_user_risk_scores_total: 10,
          all_host_risk_scores_total: 10,
          all_user_risk_scores_total_day: 10,
          all_host_risk_scores_total_day: 10,
        };
        expect(otherStats).to.eql(expected);
      });
    });
  });
};
