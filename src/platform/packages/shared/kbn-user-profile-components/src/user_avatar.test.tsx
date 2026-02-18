/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { render, screen } from '@testing-library/react';
import React from 'react';

import { UserAvatar } from './user_avatar';

describe('UserAvatar', () => {
  it('should render EuiAvatar correctly with image avatar', () => {
    render(
      <UserAvatar
        user={{
          username: 'delighted_nightingale',
          email: 'delighted_nightingale@elastic.co',
          full_name: 'Delighted Nightingale',
        }}
        avatar={{
          color: '#09e8ca',
          initials: 'DN',
          imageUrl: 'https://source.unsplash.com/64x64/?cat',
        }}
      />
    );
    const avatar = screen.getByRole('img', { hidden: true });
    expect(avatar).toBeInTheDocument();
  });

  it('should render EuiAvatar correctly with initials avatar', () => {
    render(
      <UserAvatar
        user={{
          username: 'delighted_nightingale',
          email: 'delighted_nightingale@elastic.co',
          full_name: 'Delighted Nightingale',
        }}
        avatar={{
          color: '#09e8ca',
          initials: 'DN',
          imageUrl: undefined,
        }}
      />
    );
    expect(screen.getByText('DN')).toBeInTheDocument();
  });

  it('should render EuiAvatar correctly without avatar data', () => {
    render(
      <UserAvatar
        user={{
          username: 'delighted_nightingale',
          email: 'delighted_nightingale@elastic.co',
          full_name: 'Delighted Nightingale',
        }}
      />
    );
    expect(screen.getByText('DN')).toBeInTheDocument();
  });

  it('should render EuiAvatar correctly without user data', () => {
    render(<UserAvatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
