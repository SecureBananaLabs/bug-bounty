import { z } from "zod";

const orderedBudgetRange = (payload) =>
  payload.budgetMin === undefined ||
  payload.budgetMax === undefined ||
  payload.budgetMax >= payload.budgetMin;

const budgetRangeError = {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
};

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobSchema.refine(orderedBudgetRange, budgetRangeError);

export const updateJobSchema = jobSchema.partial().refine(orderedBudgetRange, budgetRangeError);
