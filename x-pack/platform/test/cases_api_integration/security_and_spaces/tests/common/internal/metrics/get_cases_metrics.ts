/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { CaseStatuses } from '@kbn/cases-plugin/common/types/domain';
import { CaseMetricsFeature } from '@kbn/cases-plugin/common';
import {
  secOnly,
  obsOnlyRead,
  secOnlyRead,
  noKibanaPrivileges,
  superUser,
  globalRead,
  obsSecRead,
  obsSec,
} from '../../../../../common/lib/authentication/users';
import type { FtrProviderContext } from '../../../../../common/ftr_provider_context';
import {
  createCase,
  deleteAllCaseItems,
  getCasesMetrics,
  updateCase,
} from '../../../../../common/lib/api';
import { getPostCaseRequest, postCaseReq } from '../../../../../common/lib/mock';

export default ({ getService }: FtrProviderContext): void => {
  const es = getService('es');
  const supertest = getService('supertest');
  const supertestWithoutAuth = getService('supertestWithoutAuth');
  const kibanaServer = getService('kibanaServer');

  describe('all cases metrics', () => {
    it('accepts the features as string', async () => {
      const metrics = await getCasesMetrics({
        supertest,
        features: CaseMetricsFeature.MTTR,
      });

      expect(metrics).to.eql({ mttr: null });
    });

    describe(CaseMetricsFeature.MTTR, () => {
      it('responses with null if there are no cases', async () => {
        const metrics = await getCasesMetrics({
          supertest,
          features: [CaseMetricsFeature.MTTR],
        });

        expect(metrics).to.eql({ mttr: null });
      });

      it('responses with null if there are only open case and in-progress cases', async () => {
        await createCase(supertest, getPostCaseRequest());
        const theCase = await createCase(supertest, getPostCaseRequest());

        await updateCase({
          supertest,
          params: {
            cases: [
              {
                id: theCase.id,
                version: theCase.version,
                status: CaseStatuses['in-progress'],
              },
            ],
          },
        });

        const metrics = await getCasesMetrics({
          supertest,
          features: [CaseMetricsFeature.MTTR],
        });

        expect(metrics).to.eql({ mttr: null });

        await deleteAllCaseItems(es);
      });

      describe('closed and open cases from kbn archive', () => {
        before(async () => {
          await kibanaServer.importExport.load(
            'x-pack/test/functional/fixtures/kbn_archiver/cases/8.3.0/all_cases_metrics.json'
          );
        });

        after(async () => {
          await kibanaServer.importExport.unload(
            'x-pack/test/functional/fixtures/kbn_archiver/cases/8.3.0/all_cases_metrics.json'
          );

          await deleteAllCaseItems(es);
        });

        it('should calculate the mttr correctly across all cases', async () => {
          const metrics = await getCasesMetrics({
            supertest,
            features: [CaseMetricsFeature.MTTR],
          });

          expect(metrics).to.eql({ mttr: 220 });
        });

        it('should respects the range parameters', async () => {
          const metrics = await getCasesMetrics({
            supertest,
            features: [CaseMetricsFeature.MTTR],
            query: {
              from: '2022-04-28',
              to: '2022-04-29',
            },
          });

          expect(metrics).to.eql({ mttr: 90 });
        });
      });
    });

    describe(CaseMetricsFeature.STATUS, () => {
      it('responses with zeros if there are no cases', async () => {
        const metrics = await getCasesMetrics({
          supertest,
          features: [CaseMetricsFeature.STATUS],
        });

        expect(metrics).to.eql({
          status: {
            closed: 0,
            inProgress: 0,
            open: 0,
          },
        });
      });

      it('should return case statuses', async () => {
        const [, inProgressCase, postedCase] = await Promise.all([
          createCase(supertest, postCaseReq),
          createCase(supertest, postCaseReq),
          createCase(supertest, postCaseReq),
        ]);

        await updateCase({
          supertest,
          params: {
            cases: [
              {
                id: inProgressCase.id,
                version: inProgressCase.version,
                status: CaseStatuses['in-progress'],
              },
              {
                id: postedCase.id,
                version: postedCase.version,
                status: CaseStatuses.closed,
              },
            ],
          },
        });

        const metrics = await getCasesMetrics({
          supertest,
          features: [CaseMetricsFeature.STATUS],
        });

        expect(metrics.status).to.eql({
          open: 1,
          inProgress: 1,
          closed: 1,
        });

        await deleteAllCaseItems(es);
      });
    });

    describe('rbac', () => {
      before(async () => {
        await kibanaServer.importExport.load(
          'x-pack/test/functional/fixtures/kbn_archiver/cases/8.3.0/all_cases_metrics.json',
          { space: 'space1' }
        );
      });

      after(async () => {
        await kibanaServer.importExport.unload(
          'x-pack/test/functional/fixtures/kbn_archiver/cases/8.3.0/all_cases_metrics.json',
          { space: 'space1' }
        );

        await deleteAllCaseItems(es);
      });

      it('should calculate the mttr correctly only for the cases the user has access to', async () => {
        for (const scenario of [
          {
            user: globalRead,
            expectedMetrics: {
              mttr: 220,
              status: {
                closed: 3,
                inProgress: 0,
                open: 1,
              },
            },
            owners: ['securitySolutionFixture', 'observabilityFixture'],
          },
          {
            user: superUser,
            expectedMetrics: {
              mttr: 220,
              status: {
                closed: 3,
                inProgress: 0,
                open: 1,
              },
            },
            owners: ['securitySolutionFixture', 'observabilityFixture'],
          },
          {
            user: secOnlyRead,
            expectedMetrics: {
              mttr: 250,
              status: {
                closed: 2,
                inProgress: 0,
                open: 1,
              },
            },
            owners: ['securitySolutionFixture'],
          },
          {
            user: obsOnlyRead,
            expectedMetrics: {
              mttr: 160,
              status: {
                closed: 1,
                inProgress: 0,
                open: 0,
              },
            },
            owners: ['observabilityFixture'],
          },
          {
            user: obsSecRead,
            expectedMetrics: {
              mttr: 220,
              status: {
                closed: 3,
                inProgress: 0,
                open: 1,
              },
            },
            owners: ['securitySolutionFixture', 'observabilityFixture'],
          },
        ]) {
          const metrics = await getCasesMetrics({
            supertest: supertestWithoutAuth,
            features: [CaseMetricsFeature.MTTR, CaseMetricsFeature.STATUS],
            auth: {
              user: scenario.user,
              space: 'space1',
            },
          });

          expect(metrics).to.eql(scenario.expectedMetrics);
        }
      });

      for (const scenario of [
        { user: noKibanaPrivileges, space: 'space1' },
        { user: secOnly, space: 'space2' },
      ]) {
        it(`User ${scenario.user.username} with role(s) ${scenario.user.roles.join()} and space ${
          scenario.space
        } - should NOT read a case`, async () => {
          // user should not be able to read cases at the appropriate space
          await getCasesMetrics({
            supertest: supertestWithoutAuth,
            features: [CaseMetricsFeature.MTTR, CaseMetricsFeature.STATUS],
            auth: {
              user: scenario.user,
              space: scenario.space,
            },
            expectedHttpCode: 403,
          });
        });
      }

      it('should respect the owner filter when having permissions', async () => {
        const metrics = await getCasesMetrics({
          supertest: supertestWithoutAuth,
          features: [CaseMetricsFeature.MTTR, CaseMetricsFeature.STATUS],
          query: {
            owner: 'securitySolutionFixture',
          },
          auth: {
            user: obsSec,
            space: 'space1',
          },
        });

        expect(metrics).to.eql({
          mttr: 250,
          status: {
            closed: 2,
            inProgress: 0,
            open: 1,
          },
        });
      });

      it('should return the correct cases when trying to exploit RBAC through the owner query parameter', async () => {
        const metrics = await getCasesMetrics({
          supertest: supertestWithoutAuth,
          features: [CaseMetricsFeature.MTTR, CaseMetricsFeature.STATUS],
          query: {
            owner: ['securitySolutionFixture', 'observabilityFixture'],
          },
          auth: {
            user: secOnly,
            space: 'space1',
          },
        });

        expect(metrics).to.eql({
          mttr: 250,
          status: {
            closed: 2,
            inProgress: 0,
            open: 1,
          },
        });
      });

      it('should respect the owner filter when using range queries', async () => {
        const metrics = await getCasesMetrics({
          supertest: supertestWithoutAuth,
          features: [CaseMetricsFeature.MTTR, CaseMetricsFeature.STATUS],
          query: {
            from: '2022-04-20',
            to: '2022-04-30',
          },
          auth: {
            user: secOnly,
            space: 'space1',
          },
        });

        expect(metrics).to.eql({
          mttr: 250,
          status: {
            closed: 2,
            inProgress: 0,
            open: 0,
          },
        });
      });
    });
  });
};
