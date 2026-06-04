import { z } from "zod";

const orderedBudgetRange = ({ budgetMin, budgetMax }) =>
  budgetMin === undefined || budgetMax === undefined || budgetMin <= budgetMax;

const budgetRangeIssue = {
  message: "budgetMax must be greater than or equal to budgetMin",
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

export const createJobSchema = jobSchema.refine(orderedBudgetRange, budgetRangeIssue);

export const updateJobSchema = jobSchema.partial().refine(orderedBudgetRange, budgetRangeIssue);
