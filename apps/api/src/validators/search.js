import { z } from "zod";

export const MAX_SEARCH_QUERY_LENGTH = 200;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/g;
const WHITESPACE_PATTERN = /\s+/g;

export function normalizeSearchQuery(query) {
  return query
    .replace(CONTROL_CHARACTER_PATTERN, " ")
    .trim()
    .replace(WHITESPACE_PATTERN, " ");
}

export const searchQuerySchema = z.object({
  q: z.preprocess(
    (value) => value ?? "",
    z
      .string({ invalid_type_error: "Search query must be a string" })
      .transform(normalizeSearchQuery)
      .refine((query) => query.length <= MAX_SEARCH_QUERY_LENGTH, {
        message: `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`
      })
  )
});
