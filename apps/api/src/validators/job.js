import { z } from "zod";

function hasOrderedBudgetRange(payload) {
  if (payload.budgetMin === undefined || payload.budgetMax === undefined) {
    return true;
  }

  return payload.budgetMax >= payload.budgetMin;
}

const budgetRangeMessage = "budgetMax must be greater than or equal to budgetMin";

const jobPayloadSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobPayloadSchema.refine(hasOrderedBudgetRange, {
  message: budgetRangeMessage,
  path: ["budgetMax"]
});

export const updateJobSchema = jobPayloadSchema.partial().refine(hasOrderedBudgetRange, {
  message: budgetRangeMessage,
  path: ["budgetMax"]
});
