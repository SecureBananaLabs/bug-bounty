import { z } from "zod";

const jobObject = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

function checkBudgetRange(value, ctx, maxPath) {
  if (value.budgetMin === undefined || value.budgetMax === undefined) {
    return;
  }
  if (value.budgetMax < value.budgetMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: maxPath,
      message: "budgetMax must be greater than or equal to budgetMin"
    });
  }
}

export const createJobSchema = jobObject.superRefine((value, ctx) => {
  checkBudgetRange(value, ctx, ["budgetMax"]);
});

export const updateJobSchema = jobObject
  .partial()
  .superRefine((value, ctx) => {
    checkBudgetRange(value, ctx, ["budgetMax"]);
  });
