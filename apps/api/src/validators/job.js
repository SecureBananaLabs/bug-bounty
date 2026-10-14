import { z } from "zod";

function hasOrderedBudgetRange(data) {
  return data.budgetMax >= data.budgetMin;
}

const jobSchemaFields = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobSchemaFields.refine(hasOrderedBudgetRange, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});

export const updateJobSchema = jobSchemaFields.partial().refine((data) => {
  if (data.budgetMin === undefined || data.budgetMax === undefined) {
    return true;
  }

  return hasOrderedBudgetRange(data);
}, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});
