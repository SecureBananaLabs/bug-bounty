import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});
