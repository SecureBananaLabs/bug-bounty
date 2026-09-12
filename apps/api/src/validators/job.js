import { z } from "zod";

const jobSchemaFields = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const hasValidBudgetRange = (payload) =>
  payload.budgetMin === undefined ||
  payload.budgetMax === undefined ||
  payload.budgetMax >= payload.budgetMin;

const budgetRangeValidation = {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
};

export const createJobSchema = jobSchemaFields.refine(
  hasValidBudgetRange,
  budgetRangeValidation
);

export const updateJobSchema = jobSchemaFields.partial().refine(
  hasValidBudgetRange,
  budgetRangeValidation
);
