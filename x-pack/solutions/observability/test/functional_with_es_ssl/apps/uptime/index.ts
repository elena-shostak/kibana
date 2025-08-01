/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../../ftr_provider_context';

const ARCHIVE = 'x-pack/solutions/observability/test/fixtures/es_archives/uptime/full_heartbeat';

export default ({ getService, loadTestFile }: FtrProviderContext) => {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');

  describe('Uptime app', function () {
    describe('with real-world data', () => {
      before(async () => {
        await esArchiver.load(ARCHIVE);
        await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });
      });
      after(async () => await esArchiver.unload(ARCHIVE));

      loadTestFile(require.resolve('./alert_flyout'));
      loadTestFile(require.resolve('./simple_down_alert'));
    });
  });
};
