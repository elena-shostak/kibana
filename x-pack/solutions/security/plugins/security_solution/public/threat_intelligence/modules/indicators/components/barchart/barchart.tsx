/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { type FC } from 'react';
import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '@elastic/charts';
import { useElasticChartsTheme } from '@kbn/charts-theme';
import { type EuiComboBoxOptionOption } from '@elastic/eui';
import { type TimeRangeBounds } from '@kbn/data-plugin/common';
import { i18n } from '@kbn/i18n';
import { IndicatorBarchartLegendAction } from './legend_action';
import { barChartTimeAxisLabelFormatter } from '../../../../utils/dates';
import type { ChartSeries } from '../../services/fetch_aggregated_indicators';
import { useTimeZone } from '../../../../hooks/use_kibana_ui_settings';
import { useScreenReaderAnnouncements } from '../../hooks/use_screen_reader_context';

const ID = 'tiIndicator';
const DEFAULT_CHART_HEIGHT = '200px';
const DEFAULT_CHART_WIDTH = '100%';
const DEFAULT_LEGEND_SIZE = 200;

export interface IndicatorsBarChartProps {
  /**
   * Array of indicators already processed to be consumed by the BarSeries component from the @elastic/charts library.
   */
  indicators: ChartSeries[];
  /**
   * Min and max dates to nicely format the label in the @elastic/charts Axis component.
   */
  dateRange: TimeRangeBounds;
  /**
   * Indicator field selected in the IndicatorFieldSelector component, passed to AddToTimeline to populate the timeline.
   */
  field: EuiComboBoxOptionOption<string>;
  /**
   * Option height value to override the default {@link DEFAULT_CHART_HEIGHT} default barchart height.
   */
  height?: string;
}

/**
 * Displays a barchart of aggregated indicators using the @elastic/charts library.
 */
export const IndicatorsBarChart: FC<IndicatorsBarChartProps> = ({
  indicators,
  dateRange,
  field,
  height = DEFAULT_CHART_HEIGHT,
}) => {
  const chartBaseTheme = useElasticChartsTheme();
  const timeZone = useTimeZone();
  const { announce } = useScreenReaderAnnouncements();

  return (
    <Chart size={{ width: DEFAULT_CHART_WIDTH, height }}>
      <Settings
        baseTheme={chartBaseTheme}
        showLegend
        legendPosition={Position.Right}
        legendSize={DEFAULT_LEGEND_SIZE}
        legendAction={({ label }) => (
          <IndicatorBarchartLegendAction
            announceIndicatorActionChange={announce}
            field={field}
            data={label}
          />
        )}
        locale={i18n.getLocale()}
      />
      <Axis
        id={`${ID}TimeAxis`}
        position={Position.Bottom}
        tickFormat={barChartTimeAxisLabelFormatter(dateRange)}
      />
      <Axis id={`${ID}IndicatorAxis`} position={Position.Left} />
      <BarSeries
        id={`${ID}BarChart`}
        name="Indicators"
        // Defaults to multi layer time axis as of Elastic Charts v70
        xScaleType={ScaleType.Time}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        stackAccessors={['x']}
        splitSeriesAccessors={['g']}
        data={indicators}
        timeZone={timeZone}
      />
    </Chart>
  );
};
