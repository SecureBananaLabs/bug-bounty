import { z } from "zod";

export const createReviewSchema = z.object({
  reviewerId: z.string().min(1, "reviewerId is required"),
  revieweeId: z.string().min(1, "revieweeId is required"),
  rating: z.number().int().min(1).max(5, "rating must be an integer from 1 to 5"),
  comment: z.string().optional().refine(
    (val) => val === undefined || val.trim().length > 0,
    { message: "comment must not be empty" }
  ),
});
