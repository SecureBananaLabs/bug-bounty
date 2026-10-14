import { z } from "zod";

export const searchSchema = z.object({
  q: z.string().min(1).max(200)
});
