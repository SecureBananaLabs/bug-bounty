const MAX_SEARCH_QUERY_LENGTH = 100;

export function parseSearchQuery(queryParams) {
  const rawQuery = queryParams.q;

  if (rawQuery === undefined) {
    return "";
  }

  if (typeof rawQuery !== "string") {
    throw new Error("Search query must be a single string");
  }

  const query = rawQuery.trim();

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    throw new Error(`Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`);
  }

  return query;
}
