import { z } from "zod";

export const createReviewSchema = z.object({
  targetUserId: z.string().min(1, "targetUserId is required"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1, "Comment is required").max(1000)
});

export const updateReviewSchema = createReviewSchema.partial();
