import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().min(1),
  reviewerId: z.string().min(1),
  targetUserId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000)
});
