import { z } from "zod";

const baseJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const validateBudgetRange = (data) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
};

export const createJobSchema = baseJobSchema.refine(validateBudgetRange, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});

export const updateJobSchema = baseJobSchema.partial().refine(validateBudgetRange, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});
