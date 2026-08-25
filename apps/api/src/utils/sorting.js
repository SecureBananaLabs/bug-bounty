/**
 * Parse and validate sorting parameters from query string.
 * @param {string|undefined} query - Sort query string (e.g., 'createdAt:desc', 'name')
 * @param {string[]} allowedFields - Whitelist of allowed field names
 * @param {string} defaultField - Default field to sort by
 * @param {string} defaultOrder - Default sort order ('asc' or 'desc')
 * @returns {{ field: string, order: 'asc' | 'desc' }}
 */
function parseSorting(query, allowedFields, defaultField, defaultOrder = 'asc') {
  // Normalize default order
  const normalizedDefaultOrder = defaultOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
  
  // If no query provided, return defaults
  if (!query || typeof query !== 'string') {
    return { field: defaultField, order: normalizedDefaultOrder };
  }

  // Parse field and direction from query
  // Format: 'field:direction' or just 'field'
  const parts = query.split(':');
  const rawField = parts[0]?.trim();
  const rawDirection = parts[1]?.trim().toLowerCase();

  // Validate field against whitelist
  const field = allowedFields.includes(rawField) ? rawField : defaultField;

  // Normalize direction
  const order = rawDirection === 'desc' ? 'desc' : 'asc';

  return { field, order };
}

module.exports = { parseSorting };