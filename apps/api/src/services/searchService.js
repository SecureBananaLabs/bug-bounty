export async function globalSearch(params) {
  const { q, type = "all", page = 1, limit = 10 } = params;
  return {
    query: q,
    type,
    page,
    limit,
    total: 0,
    results: []
  };
}
