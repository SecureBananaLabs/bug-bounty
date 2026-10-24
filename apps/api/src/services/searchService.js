export async function globalSearch(query, options = {}) {
  // TODO: use PostgreSQL full-text search + ranking.
  return {
    query,
    page: options.page || 1,
    limit: options.limit || 10,
    users: [],
    jobs: [],
    freelancers: []
  };
}
