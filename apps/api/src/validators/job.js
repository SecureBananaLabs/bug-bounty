import { z } from "zod";

const jobFieldsSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const validBudgetRange = (payload) =>
  payload.budgetMin === undefined ||
  payload.budgetMax === undefined ||
  payload.budgetMax >= payload.budgetMin;

const budgetRangeMessage = {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
};

export const createJobSchema = jobFieldsSchema.refine(validBudgetRange, budgetRangeMessage);

export const updateJobSchema = jobFieldsSchema.partial().refine(validBudgetRange, budgetRangeMessage);
