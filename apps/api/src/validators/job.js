import { z } from "zod";

const jobShape = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

// Reject inverted ranges. Tolerates missing fields so it also fits partial updates;
// only enforces order when both bounds are present.
const orderedBudget = (data) =>
  data.budgetMin == null || data.budgetMax == null || data.budgetMax >= data.budgetMin;
const orderedBudgetError = {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
};

export const createJobSchema = jobShape.refine(orderedBudget, orderedBudgetError);
export const updateJobSchema = jobShape.partial().refine(orderedBudget, orderedBudgetError);
