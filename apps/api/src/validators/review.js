import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(1, "Review text is required").max(4000),
})
.strict();
