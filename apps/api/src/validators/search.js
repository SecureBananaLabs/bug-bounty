export function validateSearchQuery(query) {
  if (!query || typeof query !== "object") {
    return { ok: false, error: "Query parameters required" };
  }
  const q = query.q;
  if (typeof q !== "string" || q.trim().length < 2) {
    return { ok: false, error: "Search query 'q' must be at least 2 characters" };
  }
  if (q.trim().length > 100) {
    return { ok: false, error: "Search query 'q' cannot exceed 100 characters" };
  }
  return {
    ok: true,
    data: {
      q: q.trim()
    }
  };
}
