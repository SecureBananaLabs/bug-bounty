export async function globalSearch(query) {
  // TODO: use PostgreSQL full-text search + ranking.
  // For now, return a helpful message indicating search is not yet available.
  if (!query || query.length === 0) {
    return {
      query,
      message: "Please provide a search term.",
      users: [],
      jobs: [],
      freelancers: []
    };
  }
  return {
    query,
    message: "Search functionality is under development. No results returned.",
    users: [],
    jobs: [],
    freelancers: []
  };
}
