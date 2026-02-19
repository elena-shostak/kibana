/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render } from '@testing-library/react';
import React from 'react';

import { SpaceAvatarInternal } from './space_avatar_internal';

test('renders without crashing', () => {
  const { getByTestId, asFragment } = render(<SpaceAvatarInternal space={{ name: '', id: '' }} />);
  const avatar = getByTestId('space-avatar-');
  expect(avatar).toBeInTheDocument();
  expect(asFragment()).toMatchInlineSnapshot(`
    <DocumentFragment>
      <div
        aria-label=""
        class="euiAvatar euiAvatar--m euiAvatar--space emotion-euiAvatar-space-m-none"
        data-test-subj="space-avatar-"
        role="img"
        style="background-color: rgb(255, 201, 194); color: rgb(0, 0, 0);"
        title=""
      >
        <span
          aria-hidden="true"
        />
      </div>
    </DocumentFragment>
  `);
});

test('renders with a space name entirely made of whitespace', () => {
  const { getByTestId, asFragment } = render(
    <SpaceAvatarInternal space={{ name: '      ', id: '' }} />
  );
  const avatar = getByTestId('space-avatar-');
  expect(avatar).toBeInTheDocument();
  expect(asFragment()).toMatchInlineSnapshot(`
    <DocumentFragment>
      <div
        aria-label=""
        class="euiAvatar euiAvatar--m euiAvatar--space emotion-euiAvatar-space-m-none"
        data-test-subj="space-avatar-"
        role="img"
        style="background-color: rgb(97, 162, 255); color: rgb(0, 0, 0);"
        title=""
      >
        <span
          aria-hidden="true"
        />
      </div>
    </DocumentFragment>
  `);
});

test('removes aria-label when instructed not to announce the space name', () => {
  const { getByTestId, asFragment } = render(
    <SpaceAvatarInternal space={{ name: '', id: '' }} announceSpaceName={false} />
  );
  const avatar = getByTestId('space-avatar-');
  expect(avatar).toHaveAttribute('aria-hidden', 'true');
  expect(asFragment()).toMatchInlineSnapshot(`
    <DocumentFragment>
      <div
        aria-hidden="true"
        aria-label=""
        class="euiAvatar euiAvatar--m euiAvatar--space emotion-euiAvatar-space-m-none"
        data-test-subj="space-avatar-"
        role="img"
        style="background-color: rgb(255, 201, 194); color: rgb(0, 0, 0);"
        title=""
      >
        <span
          aria-hidden="true"
        />
      </div>
    </DocumentFragment>
  `);
});
