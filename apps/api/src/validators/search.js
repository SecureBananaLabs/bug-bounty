import { z } from "zod";

export const searchSchema = z.object({
  q: z
    .string()
    .max(100, "Search query must not exceed 100 characters")
    .transform((val) => val.trim().replace(/[\x00-\x1F\x7F]/g, ""))
    .default(""),
  page: z.coerce.number().int().min(1, "Page must be greater than or equal to 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(50, "Limit must not exceed 50").default(10)
});
