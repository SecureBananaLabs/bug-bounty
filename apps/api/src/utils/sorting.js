/**
 * Normalizes a sort direction string, number, or array into 'asc' or 'desc'.
 *
 * @param {string|number|Array} [order] - The raw order input
 * @param {'asc'|'desc'|null} [fallback='asc'] - Fallback direction if invalid or unspecified
 * @returns {'asc'|'desc'|null}
 */
export function normalizeOrder(order, fallback = 'asc') {
  const safeFallback = fallback === 'desc' ? 'desc' : (fallback === 'asc' ? 'asc' : null);

  if (Array.isArray(order)) {
    order = order.length > 0 ? order[0] : undefined;
  }

  if (typeof order === 'number') {
    if (order === 1) return 'asc';
    if (order === -1) return 'desc';
  }

  if (typeof order === 'string') {
    const trimmed = order.trim().toLowerCase();
    if (
      trimmed === 'asc' ||
      trimmed === 'ascending' ||
      trimmed === '1' ||
      trimmed === '+1' ||
      trimmed === 'ascend'
    ) {
      return 'asc';
    }
    if (
      trimmed === 'desc' ||
      trimmed === 'descending' ||
      trimmed === '-1' ||
      trimmed === 'descend'
    ) {
      return 'desc';
    }
  }

  return safeFallback;
}

/**
 * Parses and safely validates sorting query parameters against an allowed fields whitelist.
 * Normalizes sort direction to 'asc' or 'desc' and prevents SQL injection or unvalidated field queries.
 *
 * @param {object|string|Array} [query={}] - Request query object (e.g. req.query), compound sort string, or array
 * @param {string[]|Set<string>|object} [allowedFields=[]] - Whitelist of permitted sortable field names
 * @param {string} [defaultField] - Safe default field if query field is missing or unpermitted
 * @param {'asc'|'desc'} [defaultOrder='asc'] - Safe default sort direction
 * @returns {{ field: string, order: 'asc'|'desc', sortBy: string, sortOrder: 'asc'|'desc', direction: 'asc'|'desc', orderBy: Record<string, 'asc'|'desc'> }}
 */
export function parseSorting(query = {}, allowedFields = [], defaultField, defaultOrder = 'asc') {
  // Normalize allowed fields list into non-empty trimmed strings
  const allowedList = (
    Array.isArray(allowedFields)
      ? allowedFields
      : allowedFields instanceof Set
      ? Array.from(allowedFields)
      : allowedFields && typeof allowedFields === 'object'
      ? Object.keys(allowedFields)
      : []
  )
    .map((f) => (f !== null && f !== undefined ? String(f).trim() : ''))
    .filter((f) => f.length > 0);

  // Determine fallback default field
  const safeDefaultField =
    defaultField !== undefined && defaultField !== null && String(defaultField).trim() !== ''
      ? String(defaultField).trim()
      : (allowedList.length > 0 ? allowedList[0] : 'createdAt');

  // Determine fallback default order
  const safeDefaultOrder = normalizeOrder(defaultOrder, 'asc') || 'asc';

  let rawField = undefined;
  let rawOrder = undefined;

  if (query !== null && query !== undefined) {
    if (Array.isArray(query)) {
      if (query.length > 0) {
        if (typeof query[0] === 'object' && query[0] !== null) {
          rawField =
            query[0].sortBy ??
            query[0].sort ??
            query[0].field ??
            query[0].orderBy ??
            query[0].sort_by ??
            query[0].order_by;
          rawOrder =
            query[0].sortOrder ??
            query[0].order ??
            query[0].direction ??
            query[0].dir ??
            query[0].sort_order;
        } else {
          rawField = query[0];
          if (query.length >= 2) {
            const possibleOrder = normalizeOrder(query[1], null);
            if (possibleOrder !== null) {
              rawOrder = possibleOrder;
            }
          }
        }
      }
    } else if (typeof query === 'string') {
      const trimmed = query.trim();
      if (trimmed.includes('=') || trimmed.startsWith('?')) {
        const search = trimmed.startsWith('?') ? trimmed.slice(1) : trimmed;
        try {
          const params = new URLSearchParams(search);
          const foundField =
            params.get('sortBy') ||
            params.get('sort') ||
            params.get('field') ||
            params.get('orderBy') ||
            params.get('sort_by') ||
            params.get('order_by');
          const foundOrder =
            params.get('sortOrder') ||
            params.get('order') ||
            params.get('direction') ||
            params.get('dir') ||
            params.get('sort_order');
          if (foundField !== null || foundOrder !== null) {
            rawField = foundField;
            rawOrder = foundOrder;
          } else {
            rawField = trimmed;
          }
        } catch {
          rawField = trimmed;
        }
      } else {
        rawField = trimmed;
      }
    } else if (typeof query === 'object') {
      rawField =
        query.sortBy ??
        query.sort ??
        query.field ??
        query.orderBy ??
        query.sort_by ??
        query.order_by;
      rawOrder =
        query.sortOrder ??
        query.order ??
        query.direction ??
        query.dir ??
        query.sort_order;
    }
  }

  // Handle array values in query parameters (e.g. sortBy=['title', 'desc'])
  if (Array.isArray(rawField)) {
    if (rawField.length >= 2) {
      const candidateOrder = normalizeOrder(rawField[1], null);
      if (candidateOrder !== null) {
        rawOrder = rawOrder ?? candidateOrder;
      }
    }
    rawField = rawField.length > 0 ? rawField[0] : undefined;
  }

  // Handle compound sort strings (e.g. "-createdAt", "+title", "createdAt:desc", "title,desc", "-createdAt desc", "-title, +createdAt")
  if (typeof rawField === 'string') {
    let cleanField = rawField.trim();

    // Check if comma-delimited: e.g. "title,desc" or a list of fields "-title, +createdAt"
    if (cleanField.includes(',')) {
      const commaParts = cleanField.split(',').map((p) => p.trim()).filter(Boolean);
      if (commaParts.length >= 2) {
        const secondPartNormalized = normalizeOrder(commaParts[1], null);
        if (secondPartNormalized !== null) {
          // It's "field,order" (e.g. "title,desc")
          rawOrder = rawOrder ?? secondPartNormalized;
          cleanField = commaParts[0];
        } else {
          // It's a list of fields (e.g. "-title, +createdAt")
          cleanField = commaParts[0];
        }
      } else if (commaParts.length === 1) {
        cleanField = commaParts[0];
      }
    }

    // Check for leading '-' or '+'
    if (cleanField.startsWith('-')) {
      rawOrder = rawOrder ?? 'desc';
      cleanField = cleanField.slice(1).trim();
    } else if (cleanField.startsWith('+')) {
      rawOrder = rawOrder ?? 'asc';
      cleanField = cleanField.slice(1).trim();
    }

    // Check for colon delimiter 'field:order'
    if (cleanField.includes(':')) {
      const parts = cleanField.split(':');
      cleanField = parts[0].trim();
      const colonOrder = normalizeOrder(parts[1].trim(), null);
      if (colonOrder !== null) {
        rawOrder = rawOrder ?? colonOrder;
      }
    }

    // Check for whitespace delimiter 'field order'
    if (/\s+/.test(cleanField)) {
      const parts = cleanField.split(/\s+/);
      cleanField = parts[0].trim();
      const spaceOrder = normalizeOrder(parts[1].trim(), null);
      if (spaceOrder !== null) {
        rawOrder = rawOrder ?? spaceOrder;
      }
    }

    rawField = cleanField;
  }

  // Validate rawField strictly against allowedList whitelist
  let matchedField = null;
  if (rawField !== undefined && rawField !== null && allowedList.length > 0) {
    const stringField = String(rawField).trim();
    // 1. Exact match
    if (allowedList.includes(stringField)) {
      matchedField = stringField;
    } else {
      // 2. Case-insensitive match, preserving canonical whitelist casing
      const lower = stringField.toLowerCase();
      const canonicalMatch = allowedList.find((f) => f.toLowerCase() === lower);
      if (canonicalMatch !== undefined) {
        matchedField = canonicalMatch;
      }
    }
  }

  const finalField = matchedField !== null ? matchedField : safeDefaultField;
  const finalOrder = normalizeOrder(rawOrder, safeDefaultOrder) || safeDefaultOrder;

  return {
    field: finalField,
    order: finalOrder,
    sortBy: finalField,
    sortOrder: finalOrder,
    direction: finalOrder,
    orderBy: { [finalField]: finalOrder }
  };
}

export default parseSorting;
