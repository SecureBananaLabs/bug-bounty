import { z } from "zod";

export const createReviewSchema = z.object({
  targetUserId: z.string().min(1),
  jobId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional()
});
