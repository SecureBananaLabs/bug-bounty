import { z } from "zod";

export const createReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(500),
    reviewerId: z.string().trim().min(1).max(64),
    revieweeId: z.string().trim().min(1).max(64)
  })
  .strict();
