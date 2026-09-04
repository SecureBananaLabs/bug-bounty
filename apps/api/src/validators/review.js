import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
  jobId: z.string().min(1),
  freelancerId: z.string().min(1)
});
