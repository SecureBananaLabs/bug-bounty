import { z } from "zod";

const hasValidBudgetRange = (job) =>
  job.budgetMin === undefined ||
  job.budgetMax === undefined ||
  job.budgetMax >= job.budgetMin;

const budgetRangeMessage = {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
};

const jobSchemaBase = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobSchemaBase.refine(
  hasValidBudgetRange,
  budgetRangeMessage
);

export const updateJobSchema = jobSchemaBase.partial().refine(
  hasValidBudgetRange,
  budgetRangeMessage
);
