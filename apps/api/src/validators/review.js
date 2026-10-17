import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  jobId: z.string().min(1),
  comment: z.string().max(500).optional()
});
