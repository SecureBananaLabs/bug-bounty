import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().trim().min(1, "Job ID is required").max(64, "Job ID too long"),
  targetUserId: z.string().trim().min(1, "Target user ID is required").max(64, "Target user ID too long"),
  rating: z.number({ invalid_type_error: "Rating must be a number" }).int("Rating must be an integer").min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  comment: z.string().trim().min(5, "Comment must be at least 5 characters").max(2000, "Comment cannot exceed 2000 characters")
});
