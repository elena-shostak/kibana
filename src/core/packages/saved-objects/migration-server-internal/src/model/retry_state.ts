/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { MigrationLog } from '../types';

export interface RetryableState {
  controlState: string;
  retryCount: number;
  skipRetryReset: boolean;
  retryDelay: number;
  logs: MigrationLog[];
}

export const delayRetryState = <S extends RetryableState>(
  state: S,
  errorMessage: string,
  /** How many times to retry a step that fails */
  maxRetryAttempts: number
): S => {
  if (state.retryCount >= maxRetryAttempts) {
    return {
      ...state,
      controlState: 'FATAL',
      reason: `Unable to complete the ${state.controlState} step after ${maxRetryAttempts} attempts, terminating. The last failure message was: ${errorMessage}`,
    };
  } else {
    const retryCount = state.retryCount + 1;
    const retryDelay = 1000 * Math.min(Math.pow(2, retryCount), 64); // 2s, 4s, 8s, 16s, 32s, 64s, 64s, 64s ...
    return {
      ...state,
      retryCount,
      retryDelay,
      logs: [
        ...state.logs,
        {
          level: 'error',
          message: `Action failed with '${errorMessage}'. Retrying attempt ${retryCount} in ${
            retryDelay / 1000
          } seconds.`,
        },
      ],
    };
  }
};
export const resetRetryState = <S extends RetryableState>(state: S): S => {
  return {
    ...state,
    retryCount: state.skipRetryReset ? state.retryCount : 0,
    retryDelay: state.skipRetryReset ? state.retryDelay : 0,
    skipRetryReset: false,
  };
};
