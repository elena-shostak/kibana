/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { SerializedPanelState } from '@kbn/presentation-publishing';
import type { ControlsGroupState } from '@kbn/controls-schemas';
import {
  OPTIONS_LIST_CONTROL,
  RANGE_SLIDER_CONTROL,
  TIME_SLIDER_CONTROL,
} from '@kbn/controls-constants';

const SAVED_STATE_SESSION_STORAGE_KEY =
  'kibana.examples.controls.reactControlExample.controlGroupSavedState';
const UNSAVED_STATE_SESSION_STORAGE_KEY =
  'kibana.examples.controls.reactControlExample.controlGroupUnsavedSavedState';
export const WEB_LOGS_DATA_VIEW_ID = '90943e30-9a47-11e8-b64d-95841ca0b247';

export const savedStateManager = {
  clear: () => sessionStorage.removeItem(SAVED_STATE_SESSION_STORAGE_KEY),
  set: (serializedState: SerializedPanelState<ControlsGroupState>) =>
    sessionStorage.setItem(SAVED_STATE_SESSION_STORAGE_KEY, JSON.stringify(serializedState)),
  get: () => {
    const serializedStateJSON = sessionStorage.getItem(SAVED_STATE_SESSION_STORAGE_KEY);
    return serializedStateJSON
      ? JSON.parse(serializedStateJSON)
      : initialSerializedControlGroupState;
  },
};

export const unsavedStateManager = {
  clear: () => sessionStorage.removeItem(UNSAVED_STATE_SESSION_STORAGE_KEY),
  set: (serializedState: SerializedPanelState<ControlsGroupState>) =>
    sessionStorage.setItem(UNSAVED_STATE_SESSION_STORAGE_KEY, JSON.stringify(serializedState)),
  get: () => {
    const serializedStateJSON = sessionStorage.getItem(UNSAVED_STATE_SESSION_STORAGE_KEY);
    return serializedStateJSON ? JSON.parse(serializedStateJSON) : undefined;
  },
};

const optionsListId = 'optionsList1';
const rangeSliderControlId = 'rangeSliderControl1';
const timesliderControlId = 'timesliderControl1';
const controls = [
  {
    id: rangeSliderControlId,
    type: RANGE_SLIDER_CONTROL,
    order: 1,
    grow: true,
    width: 'medium',
    controlConfig: {
      fieldName: 'bytes',
      title: 'Bytes',
      enhancements: {},
    },
  },
  {
    id: timesliderControlId,
    type: TIME_SLIDER_CONTROL,
    order: 4,
    grow: true,
    width: 'medium',
    controlConfig: {},
  },
  {
    id: optionsListId,
    type: OPTIONS_LIST_CONTROL,
    order: 2,
    grow: true,
    width: 'medium',
    controlConfig: {
      fieldName: 'agent.keyword',
      title: 'Agent',
    },
  },
];

const initialSerializedControlGroupState = {
  rawState: {
    labelPosition: 'oneLine',
    chainingSystem: 'HIERARCHICAL',
    autoApplySelections: true,
    controls,
    ignoreParentSettings: {
      ignoreFilters: false,
      ignoreQuery: false,
      ignoreTimerange: false,
      ignoreValidations: false,
    },
  } as ControlsGroupState,
  references: [
    {
      name: `controlGroup_${rangeSliderControlId}:rangeSliderDataView`,
      type: 'index-pattern',
      id: WEB_LOGS_DATA_VIEW_ID,
    },
    {
      name: `controlGroup_${optionsListId}:optionsListDataView`,
      type: 'index-pattern',
      id: WEB_LOGS_DATA_VIEW_ID,
    },
  ],
};
