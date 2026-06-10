import { z } from "zod";

export const createReviewSchema = z.object({
  revieweeId: z.string().trim().min(1, "revieweeId is required"),
  rating: z.number().int().min(1, "rating must be at least 1").max(5, "rating must be at most 5"),
  comment: z.string().trim().min(1, "comment is required")
});
