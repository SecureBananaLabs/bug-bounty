import { z } from "zod";

// Base object shape
const jobShape = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

// Refine to reject inverted budget ranges (budgetMax < budgetMin)
function budgetRangeRefine(data, ctx) {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined && data.budgetMax < data.budgetMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "budgetMax must be greater than or equal to budgetMin",
      path: ["budgetMax"]
    });
  }
}

// Base ZodObject — used for .partial() on update
const jobBaseSchema = z.object(jobShape);

// Create: full object with refine
export const createJobSchema = jobBaseSchema.superRefine(budgetRangeRefine);

// Update: partial() on the base object, then same refine
export const updateJobSchema = jobBaseSchema.partial().superRefine(budgetRangeRefine);
