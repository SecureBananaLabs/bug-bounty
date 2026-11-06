import { z } from "zod";

const orderedBudget = (data) => !data.budgetMin || !data.budgetMax || data.budgetMax >= data.budgetMin;

const jobShape = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().trim().min(1).max(64)).max(50).default([])
};

export const createJobSchema = z.object(jobShape).refine(orderedBudget, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"],
});

export const updateJobSchema = z.object(jobShape).partial();
