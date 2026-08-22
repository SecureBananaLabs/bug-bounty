/**
 * @file pagination.js
 * Safe bounded integer pagination parser supporting take/skip, limit/offset, and page/pageSize.
 */

'use strict';

/**
 * Parses and sanitizes pagination query parameters into safe bounded integers.
 *
 * @param {Object} [query={}] - Request query parameters.
 * @param {number} [defaultTake=20] - Default page size if not specified.
 * @param {number} [maxTake=50] - Maximum allowed page size cap.
 * @returns {{ take: number, skip: number, limit: number, offset: number, page: number }}
 */
export function parsePagination(query = {}, defaultTake = 20, maxTake = 50) {
  const safeDefaultTake = Math.max(1, Number(defaultTake) || 20);
  const safeMaxTake = Math.max(safeDefaultTake, Number(maxTake) || 50);

  if (!query || typeof query !== 'object') {
    return {
      take: safeDefaultTake,
      skip: 0,
      limit: safeDefaultTake,
      offset: 0,
      page: 1,
    };
  }

  // 1. Resolve raw take / limit
  const rawTake = query.take !== undefined
    ? query.take
    : (query.limit !== undefined ? query.limit : (query.pageSize !== undefined ? query.pageSize : query.perPage));

  let take = Number(rawTake);
  if (isNaN(take) || !Number.isFinite(take) || take < 1) {
    take = safeDefaultTake;
  } else {
    take = Math.floor(take);
    take = Math.min(Math.max(1, take), safeMaxTake);
  }

  // 2. Resolve raw skip / offset or derive from page
  let skip = 0;
  if (query.skip !== undefined) {
    const parsedSkip = Number(query.skip);
    skip = isNaN(parsedSkip) || !Number.isFinite(parsedSkip) || parsedSkip < 0 ? 0 : Math.floor(parsedSkip);
  } else if (query.offset !== undefined) {
    const parsedOffset = Number(query.offset);
    skip = isNaN(parsedOffset) || !Number.isFinite(parsedOffset) || parsedOffset < 0 ? 0 : Math.floor(parsedOffset);
  } else if (query.page !== undefined) {
    const parsedPage = Number(query.page);
    const pageNum = isNaN(parsedPage) || !Number.isFinite(parsedPage) || parsedPage < 1 ? 1 : Math.floor(parsedPage);
    skip = (pageNum - 1) * take;
  }

  const derivedPage = Math.floor(skip / take) + 1;

  return {
    take,
    skip,
    limit: take,
    offset: skip,
    page: derivedPage,
  };
}
