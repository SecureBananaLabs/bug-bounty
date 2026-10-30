/**
 * @file sorting.js
 * Safe query sorting parser with strict field whitelisting and direction normalization.
 */

'use strict';

/**
 * Parses and sanitizes sorting query parameters against an allowed whitelist.
 *
 * @param {Object} [query={}] - Request query object (e.g. req.query).
 * @param {string[]} [allowedFields=[]] - Array of allowed column/field names.
 * @param {string} [defaultField='createdAt'] - Fallback field if unspecified or invalid.
 * @param {'asc'|'desc'} [defaultOrder='desc'] - Fallback sorting order.
 * @returns {{ sortBy: string, sortOrder: 'asc'|'desc', field: string, order: 'asc'|'desc' }}
 */
export function parseSorting(
  query = {},
  allowedFields = [],
  defaultField = 'createdAt',
  defaultOrder = 'desc'
) {
  const allowedSet = new Set(
    Array.isArray(allowedFields) ? allowedFields.map((f) => String(f).trim()) : []
  );

  const fallbackField = defaultField && typeof defaultField === 'string' ? defaultField.trim() : 'createdAt';
  const fallbackOrder = String(defaultOrder).toLowerCase().trim() === 'asc' ? 'asc' : 'desc';

  if (!query || typeof query !== 'object') {
    return {
      sortBy: fallbackField,
      sortOrder: fallbackOrder,
      field: fallbackField,
      order: fallbackOrder,
    };
  }

  let rawField = query.sortBy || query.sort || query.orderBy;
  let rawOrder = query.sortOrder || query.order || query.direction;

  // Handle format "sort=-createdAt" or "sort=createdAt:desc"
  if (typeof rawField === 'string') {
    const trimmed = rawField.trim();
    if (trimmed.startsWith('-')) {
      rawField = trimmed.slice(1);
      if (!rawOrder) {
        rawOrder = 'desc';
      }
    } else if (trimmed.startsWith('+')) {
      rawField = trimmed.slice(1);
      if (!rawOrder) {
        rawOrder = 'asc';
      }
    } else if (trimmed.includes(':')) {
      const [f, o] = trimmed.split(':');
      rawField = f;
      if (!rawOrder && o) {
        rawOrder = o;
      }
    }
  }

  // 1. Validate Field
  let finalField = fallbackField;
  if (typeof rawField === 'string' && rawField.trim() !== '') {
    const candidate = rawField.trim();
    if (allowedSet.size === 0 || allowedSet.has(candidate)) {
      finalField = candidate;
    }
  }

  // 2. Validate Order / Direction
  let finalOrder = fallbackOrder;
  if (typeof rawOrder === 'string' || typeof rawOrder === 'number') {
    const normalized = String(rawOrder).toLowerCase().trim();
    if (normalized === 'asc' || normalized === 'ascending' || normalized === '1') {
      finalOrder = 'asc';
    } else if (normalized === 'desc' || normalized === 'descending' || normalized === '-1') {
      finalOrder = 'desc';
    }
  }

  return {
    sortBy: finalField,
    sortOrder: finalOrder,
    field: finalField,
    order: finalOrder,
  };
}
