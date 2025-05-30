/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFlexGroup, EuiFlexItem, EuiStat, EuiTitle } from '@elastic/eui';
import numeral from '@elastic/numeral';
import { i18n } from '@kbn/i18n';
import React from 'react';
import useMount from 'react-use/lib/useMount';
import styled from '@emotion/styled';
import { useLogViewContext } from '@kbn/logs-shared-plugin/public';
import type { LogEntryAnomaly } from '../../../../../../common/log_analysis';
import { isCategoryAnomaly, logEntryRateJobType } from '../../../../../../common/log_analysis';
import type { TimeRange } from '../../../../../../common/time/time_range';
import { LogEntryExampleMessages } from '../../../../../components/logging/log_entry_examples/log_entry_examples';
import { useLogEntryExamples } from '../../use_log_entry_examples';
import { LogEntryExampleMessageTable } from './log_entry_example';
import { useLogMlJobIdFormatsShimContext } from '../../../shared/use_log_ml_job_id_formats_shim';

const EXAMPLE_COUNT = 5;

const examplesTitle = i18n.translate('xpack.infra.logs.analysis.anomaliesTableExamplesTitle', {
  defaultMessage: 'Example log entries',
});

export const AnomaliesTableExpandedRow: React.FunctionComponent<{
  anomaly: LogEntryAnomaly;
  timeRange: TimeRange;
}> = ({ anomaly, timeRange }) => {
  const { logViewReference } = useLogViewContext();
  const { idFormats } = useLogMlJobIdFormatsShimContext();

  if (logViewReference.type === 'log-view-inline') {
    throw new Error('Logs ML features only support persisted Log Views');
  }

  const {
    getLogEntryExamples,
    hasFailedLoadingLogEntryExamples,
    isLoadingLogEntryExamples,
    logEntryExamples,
  } = useLogEntryExamples({
    dataset: anomaly.dataset,
    endTime: anomaly.startTime + anomaly.duration,
    exampleCount: EXAMPLE_COUNT,
    logViewReference,
    idFormat: idFormats?.[logEntryRateJobType],
    startTime: anomaly.startTime,
    categoryId: isCategoryAnomaly(anomaly) ? anomaly.categoryId : undefined,
  });

  useMount(() => {
    getLogEntryExamples();
  });

  return (
    <>
      <ExpandedContentWrapper direction="column">
        <EuiFlexItem>
          <EuiTitle size="xs">
            <h3>{examplesTitle}</h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem>
          <LogEntryExampleMessages
            isLoading={isLoadingLogEntryExamples}
            hasFailedLoading={hasFailedLoadingLogEntryExamples}
            hasResults={logEntryExamples.length > 0}
            exampleCount={EXAMPLE_COUNT}
            onReload={getLogEntryExamples}
          >
            {logEntryExamples.length > 0 ? (
              <LogEntryExampleMessageTable
                examples={logEntryExamples}
                timeRange={timeRange}
                anomaly={anomaly}
              />
            ) : null}
          </LogEntryExampleMessages>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiStat
                titleSize="xs"
                title={`${numeral(anomaly.typical).format('0.[00]a')} ${i18n.translate(
                  'xpack.infra.logs.analysis.anomaliesExpandedRowTypicalRateTitle',
                  {
                    defaultMessage: '{typicalCount, plural, one {message} other {messages}}',
                    values: { typicalCount: anomaly.typical },
                  }
                )}`}
                description={i18n.translate(
                  'xpack.infra.logs.analysis.anomaliesExpandedRowTypicalRateDescription',
                  {
                    defaultMessage: 'Typical',
                  }
                )}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiStat
                titleSize="xs"
                title={`${numeral(anomaly.actual).format('0.[00]a')} ${i18n.translate(
                  'xpack.infra.logs.analysis.anomaliesExpandedRowActualRateTitle',
                  {
                    defaultMessage: '{actualCount, plural, one {message} other {messages}}',
                    values: { actualCount: anomaly.actual },
                  }
                )}`}
                description={i18n.translate(
                  'xpack.infra.logs.analysis.anomaliesExpandedRowActualRateDescription',
                  {
                    defaultMessage: 'Actual',
                  }
                )}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </ExpandedContentWrapper>
    </>
  );
};

const ExpandedContentWrapper = styled(EuiFlexGroup)`
  overflow: hidden;
`;
