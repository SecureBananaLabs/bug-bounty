import { z } from "zod";

// Regex metacharacters that enable catastrophic backtracking / ReDoS:
// \ * + { } ( ) [ ] | ^ $
// We allow ? and . as they are common in user search queries and safe alone.
const REDOS_PATTERN = /([\\*+{}()\[\]|^$])/g;

// Allowed: alphanumeric, spaces, basic punctuation (including ? and .)
// Uses * instead of + to allow empty strings (query can be omitted)
const SAFE_QUERY_PATTERN = /^[a-zA-Z0-9\s\-_.@:,!?'"]*$/;

export const MAX_QUERY_LENGTH = 200;

export const searchQuerySchema = z.object({
  q: z.string()
    .max(MAX_QUERY_LENGTH, `Query must be at most ${MAX_QUERY_LENGTH} characters`)
    .regex(SAFE_QUERY_PATTERN, "Query contains disallowed characters. Only alphanumeric, spaces, and basic punctuation are allowed")
    .optional()
    .default("")
});

/**
 * Sanitize a search query by removing regex-dangerous characters.
 * Used as a defense-in-depth layer after schema validation.
 */
export function sanitizeSearchQuery(query) {
  if (!query) return "";
  return query
    .replace(REDOS_PATTERN, "")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}
