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

import { UserAvatarTip } from './user_avatar_tip';

describe('UserAvatarTip', () => {
  it('should render UserToolTip correctly with UserAvatar', () => {
    render(
      <UserAvatarTip
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
    expect(screen.getByText('DN')).toBeInTheDocument();
  });

  it('should not render UserToolTip when user is not set', () => {
    render(<UserAvatarTip />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
