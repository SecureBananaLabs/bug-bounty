import { z } from "zod";

export const searchSchema = z.object({
  q: z.string()
    .trim()
    .max(200, "Search query must be at most 200 characters")
    .optional()
    .default("")
});
