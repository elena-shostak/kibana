/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export { IndexAdapter } from './src/index_adapter';
export { IndexPatternAdapter, type InstallIndex } from './src/index_pattern_adapter';
export { retryTransientEsErrors } from './src/retry_transient_es_errors';
export { ecsFieldMap, type EcsFieldMap } from './src/field_maps/ecs_field_map';
export { createOrUpdateIndexTemplate } from './src/create_or_update_index_template';
export { createOrUpdateComponentTemplate } from './src/create_or_update_component_template';

export type {
  SetComponentTemplateParams,
  SetIndexTemplateParams,
  IndexAdapterParams,
  InstallParams,
} from './src/index_adapter';
export type * from './src/field_maps/types';
