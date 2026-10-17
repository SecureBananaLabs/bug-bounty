const DEFAULT_TAKE = 20;
const MAX_TAKE = 50;

function toInteger(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.trunc(parsed);
}

// Query strings arrive as strings and use two different vocabularies across the
// API, so both spellings are normalised onto { take, skip } here.
export function parsePagination(query) {
  const source = query ?? {};
  const take = toInteger(source.take ?? source.limit, DEFAULT_TAKE);
  const skip = toInteger(source.skip ?? source.offset, 0);

  if (take < 1) {
    return { take: DEFAULT_TAKE, skip: skip < 0 ? 0 : skip };
  }

  return {
    take: take > MAX_TAKE ? MAX_TAKE : take,
    skip: skip < 0 ? 0 : skip
  };
}
