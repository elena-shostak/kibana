/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';

import { ReservedRoleBadge } from './reserved_role_badge';
import type { Role } from '../../../../common';

const reservedRole: Role = {
  name: '',
  elasticsearch: {
    cluster: [],
    indices: [],
    run_as: [],
  },
  kibana: [
    {
      spaces: ['*'],
      base: ['all'],
      feature: {},
    },
    {
      spaces: ['default'],
      base: ['foo'],
      feature: {},
    },
    {
      spaces: ['marketing'],
      base: ['read'],
      feature: {},
    },
  ],
  metadata: {
    _reserved: true,
  },
};

const unreservedRole = {
  name: '',
  elasticsearch: {
    cluster: [],
    indices: [],
    run_as: [],
  },
  kibana: [
    {
      spaces: ['*'],
      base: ['all'],
      feature: {},
    },
    {
      spaces: ['default'],
      base: ['foo'],
      feature: {},
    },
    {
      spaces: ['marketing'],
      base: ['read'],
      feature: {},
    },
  ],
};

test('it renders without crashing', () => {
  render(<ReservedRoleBadge role={reservedRole} />);
  expect(screen.getByTestId('reservedRoleBadgeTooltip')).toBeInTheDocument();
});

test('it renders nothing for an unreserved role', () => {
  const { container } = render(<ReservedRoleBadge role={unreservedRole} />);
  expect(container).toBeEmptyDOMElement();
});
