import { z } from "zod";

// `rating` is an integer in [1, 5]. `comment` is optional but must not be the
// empty string when provided, so we trim first and then apply `min(1)` to
// catch whitespace-only inputs.
export const createReviewSchema = z.object({
  reviewerId: z.string().min(1),
  revieweeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .min(1)
    .optional()
});
