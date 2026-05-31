export async function globalSearch(query) {
  if (!query || typeof query !== "string" || query.length > 200) {
    return { results: [] };
  }
  const sanitized = query.replace(/[<>"'&]/g, "").trim();
  return { results: [], query: sanitized };
}
