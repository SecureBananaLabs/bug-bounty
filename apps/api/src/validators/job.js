import { z } from "zod";

const jobSchemaBase = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([]),
});

/**
 * Schema for creating a new job posting.
 *
 * Validates that all required fields are present and that
 * `budgetMax` is not less than `budgetMin` when both values
 * are provided.
 */
export const createJobSchema = jobSchemaBase.refine(
  (data) => data.budgetMax >= data.budgetMin,
  {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"],
  }
);

/**
 * Schema for updating an existing job posting.
 * All fields are optional but must still satisfy cross-field
 * validation when both budget fields are present.
 */
export const updateJobSchema = jobSchemaBase.partial().refine(
  (data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"],
  }
);
