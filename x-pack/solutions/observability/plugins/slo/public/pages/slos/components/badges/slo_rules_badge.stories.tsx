/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { StoryFn } from '@storybook/react';

import { EuiFlexGroup } from '@elastic/eui';
import { Rule } from '@kbn/triggers-actions-ui-plugin/public';
import { KibanaReactStorybookDecorator } from '../../../../utils/kibana_react.storybook_decorator';
import { SloRulesBadge as Component, Props } from './slo_rules_badge';
import { BurnRateRuleParams } from '../../../../typings';

export default {
  component: Component,
  title: 'app/SLO/Badges/SloRulesBadge',
  decorators: [KibanaReactStorybookDecorator],
};

const Template: StoryFn<typeof Component> = (props: Props) => (
  <EuiFlexGroup gutterSize="s">
    <Component {...props} />
  </EuiFlexGroup>
);

export const WithNoRule = {
  render: Template,
  args: { rules: [] },
};

export const WithLoadingRule = {
  render: Template,
  args: { rules: undefined },
};

export const WithRule = {
  render: Template,
  args: { rules: [{ name: 'rulename' }] as Array<Rule<BurnRateRuleParams>> },
};
