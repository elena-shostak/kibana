/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiLink, EuiPageTemplate, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import React, { useMemo } from 'react';
import { LEARN_MORE_LABEL, WEB_CRAWLERS_LABEL } from '../../../common/i18n_string';
import { useKibanaServices } from '../hooks/use_kibana';
import { ElasticManagedWebCrawlersEmptyPrompt } from './web_crawlers/elastic_managed_web_crawlers_empty_prompt';

export const WebCrawlersElasticManaged = () => {
  const { console: consolePlugin } = useKibanaServices();

  const embeddableConsole = useMemo(
    () => (consolePlugin?.EmbeddableConsole ? <consolePlugin.EmbeddableConsole /> : null),
    [consolePlugin]
  );

  return (
    <EuiPageTemplate offset={0} grow restrictWidth data-test-subj="svlSearchConnectorsPage">
      <EuiPageTemplate.Header
        pageTitle={WEB_CRAWLERS_LABEL}
        data-test-subj="serverlessSearchConnectorsTitle"
        restrictWidth
      >
        <EuiText>
          <p>
            <FormattedMessage
              id="xpack.serverlessSearch.webcrawlers.headerContent"
              defaultMessage="Discover extract and index searchable content from websites and knowledge bases {learnMoreLink}"
              values={{
                learnMoreLink: (
                  <EuiLink
                    data-test-subj="serverlessSearchConnectorsOverviewLink"
                    external
                    target="_blank"
                    href={'https://github.com/elastic/crawler'}
                  >
                    {LEARN_MORE_LABEL}
                  </EuiLink>
                ),
              }}
            />
          </p>
        </EuiText>
      </EuiPageTemplate.Header>
      <EuiPageTemplate.Section restrictWidth color="subdued">
        <ElasticManagedWebCrawlersEmptyPrompt />
      </EuiPageTemplate.Section>
      {embeddableConsole}
    </EuiPageTemplate>
  );
};
