import { z } from "zod";

export const reviewSchema = z.object({
  targetId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1)
});
