import { z } from "zod";

const budgetRangeMessage = "budgetMax must be greater than or equal to budgetMin";

function hasValidBudgetRange(payload) {
  if (payload.budgetMin === undefined || payload.budgetMax === undefined) {
    return true;
  }

  return payload.budgetMax >= payload.budgetMin;
}

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobSchema.refine(hasValidBudgetRange, {
  message: budgetRangeMessage,
  path: ["budgetMax"]
});

export const updateJobSchema = jobSchema.partial().refine(hasValidBudgetRange, {
  message: budgetRangeMessage,
  path: ["budgetMax"]
});