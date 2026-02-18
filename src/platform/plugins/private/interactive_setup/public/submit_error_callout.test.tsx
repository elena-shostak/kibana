/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { errors } from '@elastic/elasticsearch';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { I18nProvider } from '@kbn/i18n-react';

import { SubmitErrorCallout } from './submit_error_callout';
import {
  ERROR_CONFIGURE_FAILURE,
  ERROR_ELASTICSEARCH_CONNECTION_CONFIGURED,
  ERROR_ENROLL_FAILURE,
  ERROR_KIBANA_CONFIG_FAILURE,
  ERROR_KIBANA_CONFIG_NOT_WRITABLE,
  ERROR_OUTSIDE_PREBOOT_STAGE,
  ERROR_PING_FAILURE,
} from '../common';
import { interactiveSetupMock } from '../server/mocks';

const renderWithIntl = (ui: React.ReactElement) =>
  render(<I18nProvider>{ui}</I18nProvider>);

describe('SubmitErrorCallout', () => {
  it('renders unknown errors correctly', async () => {
    renderWithIntl(
      <SubmitErrorCallout error={new Error('Unknown error')} defaultTitle="Something went wrong" />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Unknown error')).toBeInTheDocument();
  });

  it('renders 403 errors correctly', async () => {
    renderWithIntl(
      <SubmitErrorCallout
        error={
          new errors.ResponseError(
            interactiveSetupMock.createApiResponse({
              body: {
                statusCode: 403,
              },
            })
          )
        }
        defaultTitle="Something went wrong"
      />
    );

    expect(screen.getByText('Verification required')).toBeInTheDocument();
    expect(screen.getByText('Retry to configure Elastic.')).toBeInTheDocument();
  });

  it('renders 404 errors correctly', async () => {
    renderWithIntl(
      <SubmitErrorCallout
        error={
          new errors.ResponseError(
            interactiveSetupMock.createApiResponse({
              body: {
                statusCode: 404,
              },
            })
          )
        }
        defaultTitle="Something went wrong"
      />
    );

    expect(screen.getByText('Elastic is already configured')).toBeInTheDocument();
    expect(screen.getByText('Continue to Kibana')).toBeInTheDocument();
  });

  it('renders ERROR_CONFIGURE_FAILURE errors correctly', async () => {
    renderWithIntl(
      <SubmitErrorCallout
        error={
          new errors.ResponseError(
            interactiveSetupMock.createApiResponse({
              body: {
                statusCode: 500,
                attributes: { type: ERROR_CONFIGURE_FAILURE },
              },
            })
          )
        }
        defaultTitle="Something went wrong"
      />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Retry or update the/)).toBeInTheDocument();
    expect(screen.getByText('kibana.yml')).toBeInTheDocument();
  });

  it('renders ERROR_ELASTICSEARCH_CONNECTION_CONFIGURED errors correctly', async () => {
    renderWithIntl(
      <SubmitErrorCallout
        error={
          new errors.ResponseError(
            interactiveSetupMock.createApiResponse({
              body: {
                statusCode: 500,
                attributes: { type: ERROR_ELASTICSEARCH_CONNECTION_CONFIGURED },
              },
            })
          )
        }
        defaultTitle="Something went wrong"
      />
    );

    expect(screen.getByText('Elastic is already configured')).toBeInTheDocument();
    expect(screen.getByText('Continue to Kibana')).toBeInTheDocument();
  });

  it('renders ERROR_ENROLL_FAILURE errors correctly', async () => {
    renderWithIntl(
      <SubmitErrorCallout
        error={
          new errors.ResponseError(
            interactiveSetupMock.createApiResponse({
              body: {
                statusCode: 500,
                attributes: { type: ERROR_ENROLL_FAILURE },
              },
            })
          )
        }
        defaultTitle="Something went wrong"
      />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText('Generate a new enrollment token or configure manually.')
    ).toBeInTheDocument();
  });

  it('renders ERROR_KIBANA_CONFIG_FAILURE errors correctly', async () => {
    renderWithIntl(
      <SubmitErrorCallout
        error={
          new errors.ResponseError(
            interactiveSetupMock.createApiResponse({
              body: {
                statusCode: 500,
                attributes: { type: ERROR_KIBANA_CONFIG_FAILURE },
              },
            })
          )
        }
        defaultTitle="Something went wrong"
      />
    );

    expect(screen.getByText("Couldn't write to config file")).toBeInTheDocument();
    expect(screen.getByText(/Retry or update the/)).toBeInTheDocument();
  });

  it('renders ERROR_KIBANA_CONFIG_NOT_WRITABLE errors correctly', async () => {
    renderWithIntl(
      <SubmitErrorCallout
        error={
          new errors.ResponseError(
            interactiveSetupMock.createApiResponse({
              body: {
                statusCode: 500,
                attributes: { type: ERROR_KIBANA_CONFIG_NOT_WRITABLE },
              },
            })
          )
        }
        defaultTitle="Something went wrong"
      />
    );

    expect(screen.getByText("Couldn't write to config file")).toBeInTheDocument();
    expect(screen.getByText(/Check the file permissions/)).toBeInTheDocument();
  });

  it('renders ERROR_OUTSIDE_PREBOOT_STAGE errors correctly', async () => {
    renderWithIntl(
      <SubmitErrorCallout
        error={
          new errors.ResponseError(
            interactiveSetupMock.createApiResponse({
              body: {
                statusCode: 500,
                attributes: { type: ERROR_OUTSIDE_PREBOOT_STAGE },
              },
            })
          )
        }
        defaultTitle="Something went wrong"
      />
    );

    expect(screen.getByText('Elastic is already configured')).toBeInTheDocument();
    expect(screen.getByText('Continue to Kibana')).toBeInTheDocument();
  });

  it('renders ERROR_PING_FAILURE errors correctly', async () => {
    renderWithIntl(
      <SubmitErrorCallout
        error={
          new errors.ResponseError(
            interactiveSetupMock.createApiResponse({
              body: {
                statusCode: 500,
                attributes: { type: ERROR_PING_FAILURE },
              },
            })
          )
        }
        defaultTitle="Something went wrong"
      />
    );

    expect(screen.getByText("Couldn't connect to cluster")).toBeInTheDocument();
    expect(screen.getByText('Check the address and retry.')).toBeInTheDocument();
  });
});
