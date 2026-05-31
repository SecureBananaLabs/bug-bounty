import { z } from "zod";

const jobShape = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

function withBudgetRangeValidation(schema) {
  return schema.superRefine((payload, ctx) => {
    if (
      typeof payload.budgetMin === "number" &&
      typeof payload.budgetMax === "number" &&
      payload.budgetMax < payload.budgetMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMax"],
        message: "budgetMax must be greater than or equal to budgetMin"
      });
    }
  });
}

export const createJobSchema = withBudgetRangeValidation(z.object(jobShape));

export const updateJobSchema = withBudgetRangeValidation(z.object(jobShape).partial());
