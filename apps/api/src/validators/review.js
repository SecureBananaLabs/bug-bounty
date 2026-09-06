import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  revieweeId: z.string().min(1, "revieweeId is required"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1, "comment is required").max(2000)
});
