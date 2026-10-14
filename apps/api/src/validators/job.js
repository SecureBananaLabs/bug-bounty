import { z } from "zod";

const budgetRangeMessage = "budgetMax must be greater than or equal to budgetMin";

const jobFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

function validateBudgetRange(payload, ctx) {
  if (
    typeof payload.budgetMin === "number" &&
    typeof payload.budgetMax === "number" &&
    payload.budgetMax < payload.budgetMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["budgetMax"],
      message: budgetRangeMessage
    });
  }
}

export const createJobSchema = z.object(jobFields).superRefine(validateBudgetRange);

export const updateJobSchema = z.object(jobFields).partial().superRefine(validateBudgetRange);
