function sanitize(str) {
  return String(str).replace(/[<>&"']/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&#x27;"
  })[c] || c);
}

export async function globalSearch(query) {
  // TODO: use PostgreSQL full-text search + ranking.
  return {
    query: sanitize(query),
    users: [],
    jobs: [],
    freelancers: []
  };
}
