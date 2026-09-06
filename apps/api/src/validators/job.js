import { z } from "zod";

const budgetRangeError = "budgetMax must be greater than or equal to budgetMin";

function hasOrderedBudgetRange(payload) {
  if (payload.budgetMin === undefined || payload.budgetMax === undefined) {
    return true;
  }

  return payload.budgetMax >= payload.budgetMin;
}

const jobFieldsSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobFieldsSchema.refine(hasOrderedBudgetRange, {
  message: budgetRangeError,
  path: ["budgetMax"]
});

export const updateJobSchema = jobFieldsSchema.partial().refine(hasOrderedBudgetRange, {
  message: budgetRangeError,
  path: ["budgetMax"]
});
