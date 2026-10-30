import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().trim().min(1, "jobId is required"),
  rating: z.number().int("rating must be an integer").min(1, "rating must be at least 1").max(5, "rating cannot exceed 5"),
  comment: z.string().trim().min(1, "comment is required").max(1000, "comment cannot exceed 1000 characters")
});
