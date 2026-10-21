/**
 * Safely parses and normalises pagination parameters from request query strings.
 * Supports both canonical (take, skip) and alias (limit, offset) parameter pairs,
 * giving canonical names precedence. Clamps take to [1, maxTake] and skip to >= 0.
 *
 * @param {object} [query={}] - Request query parameters
 * @param {number} [defaultTake=20] - Default page size if not specified or invalid
 * @param {number} [maxTake=50] - Maximum allowed page size
 * @returns {{ take: number, skip: number, limit: number, offset: number }}
 */
export function parsePagination(query = {}, defaultTake = 20, maxTake = 50) {
  const safeDefaultTake = Number.isFinite(defaultTake) && defaultTake > 0 ? Math.trunc(defaultTake) : 20;
  const safeMaxTake = Number.isFinite(maxTake) && maxTake > 0 ? Math.trunc(maxTake) : 50;

  // Resolve raw values: take takes precedence over limit, skip takes precedence over offset
  const rawTake = query?.take !== undefined ? query.take : query?.limit;
  const rawSkip = query?.skip !== undefined ? query.skip : query?.offset;

  let take = safeDefaultTake;
  if (rawTake !== undefined && rawTake !== null && String(rawTake).trim() !== "") {
    const num = Number(rawTake);
    if (Number.isFinite(num)) {
      take = Math.trunc(num);
    }
  }

  // Clamp take to [1, safeMaxTake]
  take = Math.min(Math.max(1, take), safeMaxTake);

  let skip = 0;
  if (rawSkip !== undefined && rawSkip !== null && String(rawSkip).trim() !== "") {
    const num = Number(rawSkip);
    if (Number.isFinite(num)) {
      skip = Math.trunc(num);
    }
  }

  // Clamp skip to >= 0
  skip = Math.max(0, skip);

  return {
    take,
    skip,
    limit: take,
    offset: skip
  };
}
