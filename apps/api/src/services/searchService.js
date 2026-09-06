export async function globalSearch(query) {
  // TODO: use PostgreSQL full-text search + ranking.
  // Query is pre-validated by the controller (trimmed, length-limited).
  return {
    query,
    users: [],
    jobs: [],
    freelancers: []
  };
}
