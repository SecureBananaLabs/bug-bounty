import { z } from "zod";

function validateBudgetOrder(payload, ctx) {
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
}

const baseJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = baseJobSchema.superRefine(validateBudgetOrder);

export const updateJobSchema = baseJobSchema.partial().superRefine(validateBudgetOrder);
