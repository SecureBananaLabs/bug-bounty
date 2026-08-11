import { z } from "zod";

const jobFields = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

function hasOrderedBudgetRange(payload) {
  return (
    payload.budgetMin === undefined ||
    payload.budgetMax === undefined ||
    payload.budgetMax >= payload.budgetMin
  );
}

const budgetRangeOptions = {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
};

export const createJobSchema = jobFields.refine(hasOrderedBudgetRange, budgetRangeOptions);

export const updateJobSchema = jobFields.partial().refine(hasOrderedBudgetRange, budgetRangeOptions);
