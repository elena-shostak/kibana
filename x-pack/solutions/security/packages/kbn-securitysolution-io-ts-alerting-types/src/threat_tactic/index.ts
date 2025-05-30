/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* eslint-disable @typescript-eslint/naming-convention */

import * as t from 'io-ts';

export const threat_tactic_id = t.string;
export const threat_tactic_name = t.string;
export const threat_tactic_reference = t.string;

export const threat_tactic = t.type({
  id: threat_tactic_id,
  name: threat_tactic_name,
  reference: threat_tactic_reference,
});
