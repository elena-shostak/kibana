/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IndexSettings } from './indices';
import { Aliases } from './aliases';
import { Mappings } from './mappings';
import { DataStream, DataRetention } from '.';
import { DataStreamOptions } from './data_streams';

export interface ComponentTemplateSerialized {
  template: {
    settings?: IndexSettings;
    aliases?: Aliases;
    mappings?: Mappings;
    lifecycle?: DataStream['lifecycle'];
    data_stream_options?: DataStreamOptions;
  };
  version?: number;
  deprecated?: boolean;
  _meta?: { [key: string]: any };
  lifecycle?: DataRetention;
}

export interface ComponentTemplateDeserialized extends ComponentTemplateSerialized {
  name: string;
  _kbnMeta: {
    usedBy: string[];
    isManaged: boolean;
  };
}

export interface ComponentTemplateFromEs {
  name: string;
  component_template: ComponentTemplateSerialized;
}

export interface ComponentTemplateListItem {
  name: string;
  usedBy: string[];
  hasMappings: boolean;
  hasAliases: boolean;
  hasSettings: boolean;
  isManaged: boolean;
  isDeprecated?: boolean;
}

export interface ComponentTemplateDatastreams {
  data_streams: string[];
}

export interface ComponentTemplateMeta {
  managed: boolean;
  managed_by: string;
  package: {
    name: string;
  };
}
