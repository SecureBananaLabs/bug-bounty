import { z } from "zod";

const reviewIdSchema = z
  .string()
  .trim()
  .min(1, "Must not be empty.")
  .max(128, "Must not exceed 128 characters.");

export const createReviewSchema = z
  .object({
    reviewerId: reviewIdSchema,
    targetId: reviewIdSchema,
    rating: z
      .number({
        required_error: "rating is required.",
        invalid_type_error: "rating must be a number.",
      })
      .int("rating must be an integer.")
      .min(1, "rating must be between 1 and 5.")
      .max(5, "rating must be between 1 and 5."),
    comment: z
      .string({
        invalid_type_error: "comment must be a string.",
      })
      .trim()
      .min(1, "comment must not be empty.")
      .max(2000, "comment must not exceed 2000 characters.")
      .optional(),
  })
  .strict();
