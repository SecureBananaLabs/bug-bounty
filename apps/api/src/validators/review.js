import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().min(1).max(64),
  targetUserId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(2000)
});

export const updateReviewSchema = createReviewSchema.partial();
