/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { DataView } from '@kbn/data-views-plugin/common';
import type { DataTableRecord } from '@kbn/discover-utils/types';
import { isEqual } from 'lodash';
import { useMemo } from 'react';

export const MAX_COMPARISON_FIELDS = 250;

export interface UseComparisonFieldsProps {
  dataView: DataView;
  selectedFieldNames: string[];
  selectedDocIds: string[];
  showAllFields: boolean;
  showMatchingValues: boolean;
  getDocById: (id: string) => DataTableRecord | undefined;
}

export const useComparisonFields = ({
  dataView,
  selectedFieldNames,
  selectedDocIds,
  showAllFields,
  showMatchingValues,
  getDocById,
}: UseComparisonFieldsProps) => {
  const { baseDoc, comparisonDocs } = useMemo(() => {
    const [baseDocId, ...comparisonDocIds] = selectedDocIds;

    return {
      baseDoc: getDocById(baseDocId),
      comparisonDocs: comparisonDocIds
        .map((docId) => getDocById(docId))
        .filter((doc): doc is DataTableRecord => Boolean(doc)),
    };
  }, [getDocById, selectedDocIds]);

  return useMemo(() => {
    let comparisonFields = selectedFieldNames;

    if (showAllFields) {
      const sortedFields = dataView.fields
        .filter((field) => {
          if (field.name === dataView.timeFieldName) {
            return false;
          }

          return (
            baseDoc?.flattened[field.name] != null ||
            comparisonDocs.some((doc) => doc.flattened[field.name] != null)
          );
        })
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map((field) => field.name);

      comparisonFields = dataView.isTimeBased()
        ? [dataView.timeFieldName, ...sortedFields]
        : sortedFields;
    }

    if (baseDoc && !showMatchingValues) {
      comparisonFields = comparisonFields.filter((fieldName) =>
        comparisonDocs.some(
          (doc) => !isEqual(doc.flattened[fieldName], baseDoc.flattened[fieldName])
        )
      );
    }

    const totalFields = comparisonFields.length;

    if (totalFields > MAX_COMPARISON_FIELDS) {
      comparisonFields = comparisonFields.slice(0, MAX_COMPARISON_FIELDS);
    }

    return { comparisonFields, totalFields };
  }, [baseDoc, comparisonDocs, dataView, selectedFieldNames, showAllFields, showMatchingValues]);
};
