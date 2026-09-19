import { z } from "zod";

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const budgetRangeRule = {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
};

function hasValidBudgetRange(job) {
  return job.budgetMin === undefined
    || job.budgetMax === undefined
    || job.budgetMin <= job.budgetMax;
}

export const createJobSchema = jobSchema.refine(hasValidBudgetRange, budgetRangeRule);

export const updateJobSchema = jobSchema.partial().refine(hasValidBudgetRange, budgetRangeRule);
