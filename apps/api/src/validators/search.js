import { z } from "zod";

export const searchSchema = z.object({
  q: z.string().min(2, "Search query must be at least 2 characters")
});
