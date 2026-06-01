import { z } from "zod";

const hasOrderedBudgetRange = ({ budgetMin, budgetMax }) => (
  budgetMin === undefined || budgetMax === undefined || budgetMax >= budgetMin
);

const orderedBudgetRangeMessage = "budgetMax must be greater than or equal to budgetMin";

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobSchema.refine(hasOrderedBudgetRange, {
  message: orderedBudgetRangeMessage,
  path: ["budgetMax"]
});

export const updateJobSchema = jobSchema.partial().refine(hasOrderedBudgetRange, {
  message: orderedBudgetRangeMessage,
  path: ["budgetMax"]
});
