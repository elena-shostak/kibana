/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { KibanaReactStorybookDecorator } from '../../../utils/kibana_react.storybook_decorator';
import { buildSlo } from '../../../data/slo/slo';
import { HeaderTitle as Component, Props } from './header_title';

export default {
  component: Component,
  title: 'app/SLO/DetailsPage/HeaderTitle',
  decorators: [KibanaReactStorybookDecorator],
};

const defaultProps: Props = {
  slo: buildSlo(),
  isLoading: false,
};

export const Default = {
  args: defaultProps,
};

export const WithLoading = {
  args: { slo: undefined, isLoading: false },
};
