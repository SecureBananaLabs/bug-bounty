import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
  reviewerId: z.string().min(1),
  revieweeId: z.string().min(1)
});
