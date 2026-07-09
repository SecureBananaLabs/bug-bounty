function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function globalSearch(query) {
  // TODO: use PostgreSQL full-text search + ranking.
  return {
    query: escapeHtml(query ?? ''),
    users: [],
    jobs: [],
    freelancers: []
  };
}
