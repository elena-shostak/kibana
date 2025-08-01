/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import type { FtrProviderContext } from '../../../../common/ftr_provider_context';

import { getPostCaseRequest } from '../../../../common/lib/mock';
import {
  deleteAllCaseItems,
  createCase,
  deleteCases,
  getCase,
  getAuthWithSuperUser,
} from '../../../../common/lib/api';

export default ({ getService }: FtrProviderContext): void => {
  const supertestWithoutAuth = getService('supertestWithoutAuth');
  const es = getService('es');
  const authSpace1 = getAuthWithSuperUser();

  describe('delete_cases', () => {
    afterEach(async () => {
      await deleteAllCaseItems(es);
    });

    it('should delete a case in space1', async () => {
      const postedCase = await createCase(
        supertestWithoutAuth,
        getPostCaseRequest(),
        200,
        authSpace1
      );
      const body = await deleteCases({
        supertest: supertestWithoutAuth,
        caseIDs: [postedCase.id],
        auth: authSpace1,
      });

      await getCase({
        supertest: supertestWithoutAuth,
        caseId: postedCase.id,
        expectedHttpCode: 404,
        auth: authSpace1,
      });
      expect(body).to.eql({});
    });

    it('should not delete a case in a different space', async () => {
      const postedCase = await createCase(
        supertestWithoutAuth,
        getPostCaseRequest(),
        200,
        authSpace1
      );
      await deleteCases({
        supertest: supertestWithoutAuth,
        caseIDs: [postedCase.id],
        auth: getAuthWithSuperUser('space2'),
        expectedHttpCode: 404,
      });

      // the case should still be there
      const caseInfo = await getCase({
        supertest: supertestWithoutAuth,
        caseId: postedCase.id,
        auth: authSpace1,
      });
      expect(caseInfo.id).to.eql(postedCase.id);
    });
  });
};
