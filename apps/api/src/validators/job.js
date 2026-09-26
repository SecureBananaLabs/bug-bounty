import { z } from "zod";

const budgetRangeMessage = "budgetMax must be greater than or equal to budgetMin";

function hasOrderedBudgetRange(data) {
  return data.budgetMin === undefined ||
    data.budgetMax === undefined ||
    data.budgetMax >= data.budgetMin;
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
  message: budgetRangeMessage,
  path: ["budgetMax"]
});

export const updateJobSchema = jobFieldsSchema.partial().refine(hasOrderedBudgetRange, {
  message: budgetRangeMessage,
  path: ["budgetMax"]
});
