import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "rating must be between 1 and 5").max(5, "rating must be between 1 and 5"),
  comment: z.string().min(1),
  reviewerId: z.string().min(1),
  revieweeId: z.string().min(1)
});
