import { z } from "zod";

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const budgetRangeIsValid = (payload) =>
  payload.budgetMin === undefined ||
  payload.budgetMax === undefined ||
  payload.budgetMax >= payload.budgetMin;

const budgetRangeValidation = {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
};

export const createJobSchema = jobSchema.refine(
  budgetRangeIsValid,
  budgetRangeValidation
);

export const updateJobSchema = jobSchema.partial().refine(
  budgetRangeIsValid,
  budgetRangeValidation
);
