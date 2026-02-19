/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';

import { SpaceAvatarInternal } from './space_avatar_internal';

test('renders without crashing', () => {
  const { getByTestId } = render(<SpaceAvatarInternal space={{ name: '', id: '' }} />);
  const avatar = getByTestId('space-avatar-');
  expect(avatar).toBeInTheDocument();
  expect(avatar).toHaveTextContent('');
});

test('renders with a space name entirely made of whitespace', () => {
  const { getByTestId } = render(<SpaceAvatarInternal space={{ name: '      ', id: '' }} />);
  const avatar = getByTestId('space-avatar-');
  expect(avatar).toBeInTheDocument();
  expect(avatar).toHaveTextContent('');
});

test('removes aria-label when instructed not to announce the space name', () => {
  const { getByTestId } = render(
    <SpaceAvatarInternal space={{ name: '', id: '' }} announceSpaceName={false} />
  );
  const avatar = getByTestId('space-avatar-');
  expect(avatar).toHaveAttribute('aria-hidden', 'true');
  expect(avatar).toHaveTextContent('');
});
