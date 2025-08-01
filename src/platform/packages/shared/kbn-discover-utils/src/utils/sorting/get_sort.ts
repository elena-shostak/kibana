/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { DataView } from '@kbn/data-views-plugin/common';
import { isPlainObject } from 'lodash';

export type SortOrder = [string, string];
export type SortPairObj = Record<string, string>;
export type SortPair = SortOrder | SortPairObj;
export type SortInput = SortPair | SortPair[];

export function isSortable(fieldName: string, dataView: DataView, isEsqlMode: boolean): boolean {
  if (isEsqlMode) {
    // in-memory sorting is used for ES|QL queries
    // would be great to have a way to determine if a ES|QL column is sortable
    return fieldName !== '_source';
  }
  const field = dataView.getFieldByName(fieldName);
  return !!(field && field.sortable);
}

function createSortObject(
  sortPair: SortInput,
  dataView: DataView,
  isEsqlMode: boolean
): SortPairObj | undefined {
  if (
    Array.isArray(sortPair) &&
    sortPair.length === 2 &&
    isSortable(String(sortPair[0]), dataView, isEsqlMode)
  ) {
    const [field, direction] = sortPair as SortOrder;
    return { [field]: direction };
  } else if (
    isPlainObject(sortPair) &&
    isSortable(Object.keys(sortPair)[0], dataView, isEsqlMode)
  ) {
    return sortPair as SortPairObj;
  }
}

export function isLegacySort(sort: SortPair[] | SortPair): sort is SortPair {
  return (
    sort.length === 2 && typeof sort[0] === 'string' && (sort[1] === 'desc' || sort[1] === 'asc')
  );
}

/**
 * Take a sorting array and make it into an object
 * @param {array} sort two dimensional array [[fieldToSort, directionToSort]]
 *  or an array of objects [{fieldToSort: directionToSort}]
 * @param {object} dataView used for determining default sort
 * @param {boolean} isEsqlMode
 * @returns Array<{object}> an array of sort objects
 */
export function getSort(
  sort: SortPair[] | SortPair,
  dataView: DataView,
  isEsqlMode: boolean
): SortPairObj[] {
  if (Array.isArray(sort)) {
    if (isLegacySort(sort)) {
      // To stay compatible with legacy sort, which just supported a single sort field
      return [{ [sort[0]]: sort[1] }];
    }
    return sort
      .map((sortPair: SortPair) => createSortObject(sortPair, dataView, isEsqlMode))
      .filter((sortPairObj) => typeof sortPairObj === 'object') as SortPairObj[];
  }
  return [];
}

/**
 * compared to getSort it doesn't return an array of objects, it returns an array of arrays
 * [[fieldToSort: directionToSort]]
 */
export function getSortArray(
  sort: SortInput,
  dataView: DataView,
  isEsqlMode: boolean
): SortOrder[] {
  return getSort(sort, dataView, isEsqlMode).reduce((acc: SortOrder[], sortPair) => {
    const entries = Object.entries(sortPair);
    if (entries && entries[0]) {
      acc.push(entries[0]);
    }
    return acc;
  }, []);
}
