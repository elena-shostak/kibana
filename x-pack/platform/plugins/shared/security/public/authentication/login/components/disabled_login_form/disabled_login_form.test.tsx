/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';

import { DisabledLoginForm } from './disabled_login_form';

describe('DisabledLoginForm', () => {
  it('renders as expected', () => {
    render(
      <DisabledLoginForm title={'disabled message title'} message={'disabled message'} />
    );
    expect(screen.getByText('disabled message title')).toBeInTheDocument();
    expect(screen.getByText('disabled message')).toBeInTheDocument();
  });
});
