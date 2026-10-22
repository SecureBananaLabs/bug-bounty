/**
 * Normalizes a sort direction string or number into 'asc' or 'desc'.
 *
 * @param {string|number} [order] - The raw order input
 * @param {'asc'|'desc'} [fallback='asc'] - Fallback direction if invalid or unspecified
 * @returns {'asc'|'desc'}
 */
export function normalizeOrder(order, fallback = 'asc') {
  const safeFallback = fallback === 'desc' ? 'desc' : 'asc';
  if (typeof order === 'number') {
    if (order === 1) return 'asc';
    if (order === -1) return 'desc';
  }
  if (typeof order === 'string') {
    const trimmed = order.trim().toLowerCase();
    if (trimmed === 'asc' || trimmed === 'ascending' || trimmed === '1') {
      return 'asc';
    }
    if (trimmed === 'desc' || trimmed === 'descending' || trimmed === '-1') {
      return 'desc';
    }
  }
  return safeFallback;
}

/**
 * Parses and safely validates sorting query parameters against an allowed fields whitelist.
 * Normalizes sort direction to 'asc' or 'desc' and prevents SQL injection or unvalidated field queries.
 *
 * @param {object|string} [query={}] - Request query object (e.g. req.query) or compound sort string
 * @param {string[]|Set<string>|object} [allowedFields=[]] - Whitelist of permitted sortable field names
 * @param {string} [defaultField] - Safe default field if query field is missing or unpermitted
 * @param {'asc'|'desc'} [defaultOrder='asc'] - Safe default sort direction
 * @returns {{ field: string, order: 'asc'|'desc', sortBy: string, sortOrder: 'asc'|'desc', direction: 'asc'|'desc', orderBy: Record<string, 'asc'|'desc'> }}
 */
export function parseSorting(query = {}, allowedFields = [], defaultField, defaultOrder = 'asc') {
  // Normalize allowed fields list
  const allowedList = Array.isArray(allowedFields)
    ? allowedFields
    : allowedFields instanceof Set
    ? Array.from(allowedFields)
    : allowedFields && typeof allowedFields === 'object'
    ? Object.keys(allowedFields)
    : [];

  // Determine fallback default field
  const safeDefaultField =
    defaultField !== undefined && defaultField !== null && String(defaultField).trim() !== ''
      ? String(defaultField).trim()
      : (allowedList.length > 0 ? String(allowedList[0]) : 'createdAt');

  // Determine fallback default order
  const safeDefaultOrder = normalizeOrder(defaultOrder, 'asc');

  let rawField = undefined;
  let rawOrder = undefined;

  if (query !== null && query !== undefined) {
    if (typeof query === 'string') {
      const trimmed = query.trim();
      if (
        trimmed.includes('=') &&
        (trimmed.includes('&') ||
          trimmed.startsWith('?') ||
          trimmed.startsWith('sortBy=') ||
          trimmed.startsWith('sort=') ||
          trimmed.startsWith('field='))
      ) {
        const search = trimmed.startsWith('?') ? trimmed.slice(1) : trimmed;
        const params = new URLSearchParams(search);
        rawField =
          params.get('sortBy') ||
          params.get('sort') ||
          params.get('field') ||
          params.get('orderBy') ||
          params.get('sort_by') ||
          params.get('order_by');
        rawOrder =
          params.get('sortOrder') ||
          params.get('order') ||
          params.get('direction') ||
          params.get('dir') ||
          params.get('sort_order');
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

  // Handle array values in query parameters
  if (Array.isArray(rawField)) {
    if (rawField.length >= 2 && (rawField[1] === 'asc' || rawField[1] === 'desc')) {
      rawOrder = rawOrder ?? rawField[1];
    }
    rawField = rawField[0];
  }

  // Handle compound sort strings (e.g. "-createdAt", "+title", "createdAt:desc", "title,desc", "createdAt desc")
  if (typeof rawField === 'string') {
    let cleanField = rawField.trim();
    if (cleanField.startsWith('-')) {
      rawOrder = rawOrder ?? 'desc';
      cleanField = cleanField.slice(1).trim();
    } else if (cleanField.startsWith('+')) {
      rawOrder = rawOrder ?? 'asc';
      cleanField = cleanField.slice(1).trim();
    } else if (cleanField.includes(':')) {
      const parts = cleanField.split(':');
      cleanField = parts[0].trim();
      rawOrder = rawOrder ?? parts[1].trim();
    } else if (cleanField.includes(',')) {
      const parts = cleanField.split(',');
      cleanField = parts[0].trim();
      rawOrder = rawOrder ?? parts[1].trim();
    } else if (/\s+/.test(cleanField)) {
      const parts = cleanField.split(/\s+/);
      cleanField = parts[0].trim();
      rawOrder = rawOrder ?? parts[1].trim();
    }
    rawField = cleanField;
  }

  // Validate rawField strictly against allowedList whitelist
  let matchedField = null;
  if (rawField && allowedList.length > 0) {
    const stringField = String(rawField).trim();
    // 1. Exact match
    if (allowedList.includes(stringField)) {
      matchedField = stringField;
    } else {
      // 2. Case-insensitive match, preserving canonical whitelist casing
      const lower = stringField.toLowerCase();
      const canonicalMatch = allowedList.find((f) => String(f).toLowerCase() === lower);
      if (canonicalMatch !== undefined) {
        matchedField = String(canonicalMatch);
      }
    }
  }

  const finalField = matchedField !== null ? matchedField : safeDefaultField;
  const finalOrder = normalizeOrder(rawOrder, safeDefaultOrder);

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
