import { z } from "zod";

/**
 * Base job schema without refinements.
 * Separated so that `.partial()` can be called on the raw object
 * (Zod v4 forbids `.partial()` on refined schemas).
 */
const baseJobFields = z.object({
  title: z.string()
    .min(4, "Title must be at least 4 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  budgetMin: z.number()
    .nonnegative("budgetMin must be non-negative")
    .finite("budgetMin must be a finite number"),
  budgetMax: z.number()
    .nonnegative("budgetMax must be non-negative")
    .finite("budgetMax must be a finite number"),
  categoryId: z.string()
    .min(1, "categoryId is required")
    .max(100, "categoryId must be at most 100 characters"),
  skills: z.array(
    z.string()
      .min(1, "Skill must be a non-empty string")
      .max(50, "Skill must be at most 50 characters")
  ).max(20, "Maximum 20 skills allowed").default([])
});

/**
 * Schema for creating a new job posting.
 *
 * Validates:
 * - title: 4-200 characters
 * - description: 10-5000 characters
 * - budgetMin: non-negative finite number
 * - budgetMax: non-negative finite number, must be >= budgetMin
 * - categoryId: non-empty string
 * - skills: array of strings (defaults to empty)
 *
 * @example
 * ```js
 * const result = createJobSchema.safeParse({
 *   title: "Build a website",
 *   description: "Need a modern landing page with responsive design",
 *   budgetMin: 100,
 *   budgetMax: 500,
 *   categoryId: "web-development",
 *   skills: ["react", "css"]
 * });
 * ```
 */
export const createJobSchema = baseJobFields.refine(
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
export const updateJobSchema = baseJobFields.partial().refine(
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
