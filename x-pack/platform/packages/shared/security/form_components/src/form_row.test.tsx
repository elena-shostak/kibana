/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import React from 'react';

import { FormRow } from './form_row';

describe('FormRow', () => {
  it('should display error when field is touched and has error', () => {
    render(
      <Formik
        onSubmit={jest.fn()}
        initialValues={{ email: '' }}
        initialErrors={{ email: 'Email is required' }}
        initialTouched={{ email: true }}
      >
        <FormRow>
          <input name="email" />
        </FormRow>
      </Formik>
    );

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('should not display error when field is not touched', () => {
    render(
      <Formik
        onSubmit={jest.fn()}
        initialValues={{ email: '' }}
        initialErrors={{ email: 'Email is required' }}
        initialTouched={{ email: false }}
      >
        <FormRow>
          <input name="email" />
        </FormRow>
      </Formik>
    );

    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('should not display error when there is no error', () => {
    render(
      <Formik
        onSubmit={jest.fn()}
        initialValues={{ email: '' }}
        initialErrors={{}}
        initialTouched={{ email: true }}
      >
        <FormRow>
          <input name="email" />
        </FormRow>
      </Formik>
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
