import { z } from "zod";

export const MAX_SEARCH_QUERY_LENGTH = 100;

export const searchQuerySchema = z.object({
  q: z.string().trim().max(MAX_SEARCH_QUERY_LENGTH).default("")
});
