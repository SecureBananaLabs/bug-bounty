import { z } from "zod";

const hasOrderedBudgetRange = ({ budgetMin, budgetMax }) => budgetMax >= budgetMin;

const jobSchemaBase = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobSchemaBase.refine(hasOrderedBudgetRange, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});

export const updateJobSchema = jobSchemaBase.partial().refine(
  ({ budgetMin, budgetMax }) => budgetMin == null || budgetMax == null || budgetMax >= budgetMin,
  {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"]
  }
);
