import { z } from "zod";

export const createReviewSchema = z.object({
  reviewerId: z.string().min(1, "reviewerId is required"),
  revieweeId: z.string().min(1, "revieweeId is required"),
  rating: z.number().int().min(1).max(5, "rating must be between 1 and 5"),
  comment: z.string().trim().min(1, "comment cannot be empty if provided").optional()
});
