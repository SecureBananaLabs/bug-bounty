import { z } from "zod";

const jobFieldsSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

function hasValidBudgetRange(payload) {
  return (
    payload.budgetMin === undefined ||
    payload.budgetMax === undefined ||
    payload.budgetMax >= payload.budgetMin
  );
}

export const createJobSchema = jobFieldsSchema.refine(hasValidBudgetRange, {
  path: ["budgetMax"],
  message: "budgetMax must be greater than or equal to budgetMin"
});

export const updateJobSchema = jobFieldsSchema.partial().refine(hasValidBudgetRange, {
  path: ["budgetMax"],
  message: "budgetMax must be greater than or equal to budgetMin"
});
