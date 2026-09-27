import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().min(1),
  reviewerId: z.string().min(1),
  rating: z.number().positive(),
  comment: z.string().min(1)
});
