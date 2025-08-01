/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { createContext, useContext } from 'react';
import type { ChromeBreadcrumb } from '@kbn/core-chrome-browser';
import type { CoreStart } from '@kbn/core/public';
import type { BuildFlavor } from '@kbn/config';
import type { StartDependencies } from './plugin';

interface ContextValue extends StartDependencies {
  setBreadcrumbs: (crumbs: ChromeBreadcrumb[]) => void;

  capabilities: CoreStart['application']['capabilities'];
  navigateToApp: CoreStart['application']['navigateToApp'];
  kibanaBranch: string;
  buildFlavor: BuildFlavor;
  securityAIAssistantEnabled: boolean;
}

const AppContext = createContext<ContextValue>(null as any);

export const AppContextProvider = ({
  children,
  value,
}: {
  value: ContextValue;
  children: React.ReactNode;
}) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('"useAppContext" can only be called inside of AppContext.Provider!');
  }
  return ctx;
};
