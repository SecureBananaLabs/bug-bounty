import { z } from "zod";

export const createReviewSchema = z.object({
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000),
});

export const updateReviewSchema = createReviewSchema.partial();
