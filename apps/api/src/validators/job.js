import { z } from "zod";

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

function hasInvertedBudgetRange({ budgetMin, budgetMax }) {
  return budgetMin !== undefined && budgetMax !== undefined && budgetMax < budgetMin;
}

function applyBudgetRangeValidation(schema) {
  return schema.superRefine((payload, ctx) => {
    if (hasInvertedBudgetRange(payload)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMax"],
        message: "budgetMax must be greater than or equal to budgetMin"
      });
    }
  });
}

export const createJobSchema = applyBudgetRangeValidation(jobSchema);
export const updateJobSchema = applyBudgetRangeValidation(jobSchema.partial());
