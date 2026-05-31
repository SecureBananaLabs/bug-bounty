import { z } from "zod";

/**
 * Schema for creating a new job posting.
 *
 * Validates:
 * - title: minimum 4 characters
 * - description: minimum 10 characters
 * - budgetMin: non-negative number
 * - budgetMax: non-negative number, must be >= budgetMin
 * - categoryId: non-empty string
 * - skills: array of strings (defaults to empty)
 *
 * @example
 * ```js
 * const result = createJobSchema.safeParse({
 *   title: "Build a website",
 *   description: "Need a modern landing page",
 *   budgetMin: 100,
 *   budgetMax: 500,
 *   categoryId: "web-development",
 *   skills: ["react", "css"]
 * });
 * ```
 */
export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
}).refine(
  (data) => data.budgetMax >= data.budgetMin,
  {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"],
  }
);

/**
 * Schema for updating an existing job posting.
 *
 * All fields are optional (partial update).
 * When both budgetMin and budgetMax are provided,
 * budgetMax must be >= budgetMin.
 *
 * @example
 * ```js
 * // Valid: update only title
 * updateJobSchema.parse({ title: "New Title" });
 *
 * // Valid: update both budgets with valid range
 * updateJobSchema.parse({ budgetMin: 200, budgetMax: 800 });
 *
 * // Invalid: inverted budget range
 * updateJobSchema.parse({ budgetMin: 500, budgetMax: 100 });
 * // => throws ZodError
 * ```
 */
export const updateJobSchema = createJobSchema.partial().refine(
  (data) => {
    // Only validate when both fields are present
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  {
    message: "budgetMax must be greater than or equal to budgetMin when both are provided",
    path: ["budgetMax"],
  }
);
