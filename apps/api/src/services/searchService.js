export async function globalSearch(query) {
  // TODO: use PostgreSQL full-text search + ranking.
  return {
    query,
    users: [],
    jobs: [],
    freelancers: []
  };
}
