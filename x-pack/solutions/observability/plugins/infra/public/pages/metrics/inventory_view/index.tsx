/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { useTrackPageview } from '@kbn/observability-shared-plugin/public';
import { APP_WRAPPER_CLASS } from '@kbn/core/public';
import { css } from '@emotion/react';
import { OnboardingFlow } from '../../../components/shared/templates/no_data_config';
import { InfraPageTemplate } from '../../../components/shared/templates/infra_page_template';
import { useMetricsBreadcrumbs } from '../../../hooks/use_metrics_breadcrumbs';
import { inventoryTitle } from '../../../translations';
import { SavedViews } from './components/saved_views';
import { SnapshotContainer } from './components/snapshot_container';
import { fullHeightContentStyles } from '../../../page_template.styles';
import { SurveySection } from './components/survey_section';
import { WaffleOptionsProvider } from './hooks/use_waffle_options';
import { WaffleTimeProvider } from './hooks/use_waffle_time';
import { WaffleFiltersProvider } from './hooks/use_waffle_filters';

export const SnapshotPage = () => {
  useTrackPageview({ app: 'infra_metrics', path: 'inventory' });
  useTrackPageview({ app: 'infra_metrics', path: 'inventory', delay: 15000 });

  useMetricsBreadcrumbs([
    {
      text: inventoryTitle,
    },
  ]);

  return (
    <WaffleOptionsProvider>
      <WaffleTimeProvider>
        <WaffleFiltersProvider>
          <div className={APP_WRAPPER_CLASS}>
            <InfraPageTemplate
              onboardingFlow={OnboardingFlow.Infra}
              pageHeader={{
                pageTitle: inventoryTitle,
                rightSideItems: [<SavedViews />, <SurveySection />],
              }}
              pageSectionProps={{
                contentProps: {
                  css: css`
                    ${fullHeightContentStyles};
                    padding-bottom: 0;
                  `,
                },
              }}
            >
              <SnapshotContainer />
            </InfraPageTemplate>
          </div>
        </WaffleFiltersProvider>
      </WaffleTimeProvider>
    </WaffleOptionsProvider>
  );
};
