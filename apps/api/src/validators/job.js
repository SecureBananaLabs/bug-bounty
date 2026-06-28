import { z } from "zod";

export const jobSchemaBase = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

function validateBudgetRange(payload, ctx) {
  if (
    payload.budgetMin !== undefined &&
    payload.budgetMax !== undefined &&
    payload.budgetMax < payload.budgetMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["budgetMax"],
      message: "budgetMax must be greater than or equal to budgetMin"
    });
  }
}

export const createJobSchema = jobSchemaBase.superRefine(validateBudgetRange);

export const updateJobSchema = jobSchemaBase.partial().superRefine(validateBudgetRange);
