import { z } from "zod";

export const searchSchema = z.object({
  q: z
    .string()
    .max(200, "Query too long, max 200 characters")
    .trim()
    .optional()
    .default("")
});
