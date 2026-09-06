/**
 * Bounded integer pagination parsing helper
 * @param {object} query - Express request query object
 * @param {number} [defaultTake=20] - Default page size
 * @param {number} [maxTake=50] - Maximum allowed page size
 * @returns {{ take: number, skip: number }}
 */
export function parsePagination(query = {}, defaultTake = 20, maxTake = 50) {
  const rawTake = query.take !== undefined ? query.take : query.limit;
  const rawSkip = query.skip !== undefined ? query.skip : query.offset;

  let take = parseInt(rawTake, 10);
  if (isNaN(take) || take <= 0) {
    take = defaultTake;
  } else if (take > maxTake) {
    take = maxTake;
  }

  let skip = parseInt(rawSkip, 10);
  if (isNaN(skip) || skip < 0) {
    skip = 0;
  }

  return { take, skip };
}
