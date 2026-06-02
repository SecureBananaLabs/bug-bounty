import { z } from "zod";

export const createReviewSchema = z.object({
  reviewerId: z.string().min(1, "Reviewer ID is required"),
  revieweeId: z.string().min(1, "Reviewee ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().optional()
});

export const updateReviewSchema = createReviewSchema.partial();
