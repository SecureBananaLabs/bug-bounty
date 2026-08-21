/**
 * Parses and validates sorting query parameters against an allowed whitelist.
 * @param {Record<string, unknown>} query - Query params from Express request
 * @param {string[]} allowedFields - Whitelist of allowed field names
 * @param {string} defaultField - Default sort field
 * @param {'asc' | 'desc'} defaultOrder - Default sort direction
 * @returns {{ sortBy: string, sortOrder: 'asc' | 'desc' }} Safe sorting configuration
 */
export function parseSorting(query = {}, allowedFields = [], defaultField = 'createdAt', defaultOrder = 'desc') {
  const requestedField = typeof query.sortBy === 'string' ? query.sortBy.trim() : '';
  const requestedOrder = typeof query.sortOrder === 'string' ? query.sortOrder.trim().toLowerCase() : '';

  const sortBy = allowedFields.includes(requestedField) ? requestedField : defaultField;
  const sortOrder = requestedOrder === 'asc' || requestedOrder === 'desc' ? requestedOrder : defaultOrder;

  return { sortBy, sortOrder };
}
