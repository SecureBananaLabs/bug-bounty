import { z } from "zod";

export const MAX_QUERY_LENGTH = 200;

export const searchQuerySchema = z.object({
  q: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(MAX_QUERY_LENGTH))
    .optional()
});
