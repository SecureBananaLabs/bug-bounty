import { z } from "zod";

const MAX_QUERY_LENGTH = 200;

export const searchQuerySchema = z.object({
  q: z
    .string({ invalid_type_error: "q must be a string" })
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "q must not be empty")
    .refine((v) => v.length <= MAX_QUERY_LENGTH, `q must be at most ${MAX_QUERY_LENGTH} characters`)
});
