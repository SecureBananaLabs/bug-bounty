import { z } from "zod";

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const orderedBudgetRange = ({ budgetMin, budgetMax }) =>
  budgetMin === undefined || budgetMax === undefined || budgetMin <= budgetMax;

const budgetRangeMessage = "budgetMin must be less than or equal to budgetMax";

export const createJobSchema = jobSchema.refine(orderedBudgetRange, {
  message: budgetRangeMessage,
  path: ["budgetMax"]
});

export const updateJobSchema = jobSchema.partial().refine(orderedBudgetRange, {
  message: budgetRangeMessage,
  path: ["budgetMax"]
});
