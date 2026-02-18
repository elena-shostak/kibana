/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { I18nProvider } from '@kbn/i18n-react';

import type { CopyModeControlProps } from './copy_mode_control';
import { CopyModeControl } from './copy_mode_control';

const renderWithIntl = (ui: React.ReactElement) =>
  render(<I18nProvider>{ui}</I18nProvider>);

describe('CopyModeControl', () => {
  const initialValues = { createNewCopies: true, overwrite: true };
  const updateSelection = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  const props: CopyModeControlProps = { initialValues, updateSelection };

  it('should allow the user to toggle overwrite', async () => {
    renderWithIntl(<CopyModeControl {...props} />);

    expect(updateSelection).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('cts-copyModeControl-createNewCopiesDisabled'));
    const createNewCopies = false;

    fireEvent.click(screen.getByTestId('cts-copyModeControl-overwriteDisabled'));
    expect(updateSelection).toHaveBeenNthCalledWith(2, { createNewCopies, overwrite: false });

    fireEvent.click(screen.getByTestId('cts-copyModeControl-overwriteEnabled'));
    expect(updateSelection).toHaveBeenNthCalledWith(3, { createNewCopies, overwrite: true });
  });

  it('should enable the Overwrite switch when createNewCopies is disabled', async () => {
    renderWithIntl(<CopyModeControl {...props} />);

    expect(screen.getByTestId('cts-copyModeControl-overwriteRadioGroup')).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByTestId('cts-copyModeControl-createNewCopiesDisabled'));
    expect(screen.getByTestId('cts-copyModeControl-overwriteRadioGroup')).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('should allow the user to toggle createNewCopies', async () => {
    renderWithIntl(<CopyModeControl {...props} />);

    expect(updateSelection).not.toHaveBeenCalled();
    const { overwrite } = initialValues;

    fireEvent.click(screen.getByTestId('cts-copyModeControl-createNewCopiesDisabled'));
    expect(updateSelection).toHaveBeenNthCalledWith(1, { createNewCopies: false, overwrite });

    fireEvent.click(screen.getByTestId('cts-copyModeControl-createNewCopiesEnabled'));
    expect(updateSelection).toHaveBeenNthCalledWith(2, { createNewCopies: true, overwrite });
  });
});
