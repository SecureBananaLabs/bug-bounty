import { z } from "zod";

function hasOrderedBudgetRange(payload) {
  if (payload.budgetMin === undefined || payload.budgetMax === undefined) {
    return true;
  }
  return payload.budgetMax >= payload.budgetMin;
}

const jobShape = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobShape.refine(hasOrderedBudgetRange, {
  path: ["budgetMax"],
  message: "budgetMax must be greater than or equal to budgetMin"
});

export const updateJobSchema = jobShape.partial().refine(hasOrderedBudgetRange, {
  path: ["budgetMax"],
  message: "budgetMax must be greater than or equal to budgetMin"
});
