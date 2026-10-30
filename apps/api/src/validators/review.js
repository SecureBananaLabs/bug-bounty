import { z } from "zod";

export const createReviewSchema = z.object({
  revieweeId: z.string().trim().min(1, "revieweeId is required"),
  reviewerId: z.string().trim().min(1, "reviewerId is required"),
  rating: z.number().int().min(1, "rating must be at least 1").max(5, "rating must be at most 5"),
  comment: z.string().trim().min(3, "comment must be at least 3 characters").max(1000, "comment cannot exceed 1000 characters")
});
