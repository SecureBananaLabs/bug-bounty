import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().max(200, "Query must be 200 characters or less")
});