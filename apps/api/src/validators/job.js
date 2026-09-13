import { z } from "zod";

const jobSchemaBase = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const orderedBudgetRange = (job) => job.budgetMax >= job.budgetMin;

export const createJobSchema = jobSchemaBase.refine(orderedBudgetRange, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});

export const updateJobSchema = jobSchemaBase.partial().refine((job) => {
  if (job.budgetMin === undefined || job.budgetMax === undefined) {
    return true;
  }

  return orderedBudgetRange(job);
}, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});
