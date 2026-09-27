import { z } from "zod";

const jobBudgetRange = (payload) =>
  payload.budgetMin === undefined ||
  payload.budgetMax === undefined ||
  payload.budgetMin <= payload.budgetMax;

const budgetRangeMessage = {
  message: "budgetMin must be less than or equal to budgetMax",
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

export const createJobSchema = jobSchema.refine(jobBudgetRange, budgetRangeMessage);

export const updateJobSchema = jobSchema.partial().refine(jobBudgetRange, budgetRangeMessage);
