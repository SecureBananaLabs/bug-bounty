/**
 * Pagination utility for list endpoints.
 * Accepts `page` and `limit` query params, returns paginated slice + metadata.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse pagination params from Express req.query.
 * @param {object} query - req.query from Express
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePagination(query) {
  let page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  let limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build a paginated response object.
 * @param {Array} items - The sliced data array
 * @param {number} total - Total item count
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {{ data: Array, pagination: { total, page, limit, pages } }}
 */
export function paginate(items, total, page, limit) {
  return {
    data: items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Slice an array for pagination (for in-memory stores).
 * @param {Array} arr - Full dataset
 * @param {number} skip - Items to skip
 * @param {number} limit - Items to take
 * @returns {Array}
 */
export function slicePage(arr, skip, limit) {
  return arr.slice(skip, skip + limit);
}
