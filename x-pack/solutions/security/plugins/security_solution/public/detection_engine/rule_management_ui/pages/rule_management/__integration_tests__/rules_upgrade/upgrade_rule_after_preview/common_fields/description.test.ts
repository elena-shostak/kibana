/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { assertRuleUpgradePreview } from '../../test_utils/assert_rule_upgrade_preview';
import { assertRuleUpgradeAfterReview } from '../../test_utils/assert_rule_upgrade_after_review';
import { assertDiffAfterSavingUnchangedValue } from '../../test_utils/assert_diff_after_saving_unchanged_value';
import { assertFieldValidation } from '../../test_utils/assert_field_validation';

describe('Upgrade diffable rule "description" (query rule type) after preview in flyout', () => {
  const ruleType = 'query';
  const fieldName = 'description';
  const humanizedFieldName = 'Description';
  const initial = 'Initial description';
  const customized = 'Custom description';
  const upgrade = 'Updated description';
  const resolvedValue = 'Resolved description';

  assertRuleUpgradePreview({
    ruleType,
    fieldName,
    humanizedFieldName,
    fieldVersions: {
      initial,
      customized,
      upgrade,
      resolvedValue,
    },
  });

  assertDiffAfterSavingUnchangedValue({
    ruleType,
    fieldName,
    fieldVersions: {
      initial,
      upgrade,
    },
  });

  assertFieldValidation({
    ruleType,
    fieldName,
    fieldVersions: {
      initial,
      upgrade,
      // empty description is invalid
      invalidValue: '',
    },
  });

  assertRuleUpgradeAfterReview({
    ruleType,
    fieldName,
    fieldVersions: {
      initial,
      customized,
      upgrade,
      resolvedValue,
    },
  });
});
