import { z } from "zod";

export const createReviewSchema = z
  .object({
    targetId: z.string().trim().min(1, "targetId is required").max(128),
    reviewerId: z.string().trim().min(1, "reviewerId is required").max(128),
    rating: z
      .number()
      .int("Rating must be an integer")
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5"),
    comment: z.string().trim().min(1, "Comment cannot be empty").max(2000).optional()
  })
  .strict();
