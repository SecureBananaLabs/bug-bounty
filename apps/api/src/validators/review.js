import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
});

