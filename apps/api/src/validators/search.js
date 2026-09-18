const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/g;
export const MAX_SEARCH_QUERY_LENGTH = 200;

export function normalizeSearchQuery(rawQuery) {
  let candidate = rawQuery;

  if (Array.isArray(candidate)) {
    candidate = candidate[0] ?? "";
  }

  if (candidate == null) {
    candidate = "";
  }

  if (typeof candidate !== "string") {
    return { error: "Search query must be a string." };
  }

  const normalized = candidate.replace(CONTROL_CHAR_REGEX, "").trim();
  if (normalized.length > MAX_SEARCH_QUERY_LENGTH) {
    return {
      error: `Search query must be at most ${MAX_SEARCH_QUERY_LENGTH} characters.`
    };
  }

  return { value: normalized };
}
