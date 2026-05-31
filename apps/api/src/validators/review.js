import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  reviewerId: z.string().min(1, "reviewerId is required"),
  rating: z.number().int().min(1, "rating must be at least 1").max(5, "rating must be at most 5"),
  comment: z.string().min(1, "comment is required")
});
