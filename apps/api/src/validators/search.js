import { z } from "zod";

export const searchSchema = z.object({
  q: z.string().trim().min(1).max(200)
}).passthrough();
