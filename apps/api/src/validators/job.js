import { z } from "zod";

const jobShape = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

const withOrderedBudgetRange = (schema) =>
  schema.superRefine((value, ctx) => {
    if (
      value.budgetMin !== undefined &&
      value.budgetMax !== undefined &&
      value.budgetMax < value.budgetMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMax"],
        message: "budgetMax must be greater than or equal to budgetMin"
      });
    }
  });

export const createJobSchema = withOrderedBudgetRange(z.object(jobShape));
export const updateJobSchema = withOrderedBudgetRange(z.object(jobShape).partial());
