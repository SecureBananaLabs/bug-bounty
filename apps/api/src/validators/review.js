import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1),
  reviewerId: z.string().trim().min(1),
  revieweeId: z.string().trim().min(1)
});
