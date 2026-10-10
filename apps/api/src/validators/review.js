import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(2000),
  jobId: z.string().min(1),
  freelancerId: z.string().min(1)
});
