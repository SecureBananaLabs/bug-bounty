export async function globalSearch(query) {
  const MAX_QUERY_LENGTH = 500;
  const safeQuery = String(query ?? "").slice(0, MAX_QUERY_LENGTH);
  // TODO: use PostgreSQL full-text search + ranking.
  return {
    query: safeQuery,
    users: [],
    jobs: [],
    freelancers: []
  };
}
