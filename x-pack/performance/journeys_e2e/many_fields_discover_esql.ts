/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Journey } from '@kbn/journeys';
import { subj } from '@kbn/test-subj-selector';

export const journey = new Journey({
  kbnArchives: ['src/platform/test/functional/fixtures/kbn_archiver/many_fields_data_view'],
  esArchives: ['src/platform/test/functional/fixtures/es_archiver/many_fields'],
})
  .step('Go to Discover Page', async ({ page, kbnUrl, kibanaPage }) => {
    await page.goto(
      kbnUrl.get(
        `/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:60000),time:(from:now-15m,to:now))&_a=(columns:!(),filters:!(),dataSource:(type:esql),hideChart:!t,interval:auto,query:(esql:'from%20indices-stats*%20%7C%20limit%20500'),sort:!())`
      )
    );
    await kibanaPage.waitForHeader();
    await page.waitForSelector('[data-test-subj="discoverDocTable"][data-render-complete="true"]');
    await page.waitForSelector(subj('globalLoadingIndicator-hidden'));
  })
  .step('Expand the first document', async ({ page, kbnUrl }) => {
    const expandButtons = page.locator(subj('docTableExpandToggleColumn'));
    await expandButtons.first().click();
    await page.waitForSelector(subj('kbnDocViewer'));
    await page.goto(
      kbnUrl.get(
        `/app/discover#/doc/35796250-bb09-11ec-a8e4-a9868e049a39/indices-stats?id=Bh6t-H8BbBF9z83A6xeC`
      )
    );
    await page.waitForSelector(subj('globalLoadingIndicator-hidden'));
  });
