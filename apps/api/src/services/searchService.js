const sanitizeQuery = (q) => String(q || "").replace(/['";-]/g, "").trim();

export async function globalSearch(sanitizeQuery(query)) {
  // TODO: use PostgreSQL full-text search + ranking.
  return {
    query,
    users: [],
    jobs: [],
    freelancers: []
  };
}
