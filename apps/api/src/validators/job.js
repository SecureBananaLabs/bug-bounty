import { z } from "zod";

const orderedBudgetRange = (data) =>
  data.budgetMin === undefined ||
  data.budgetMax === undefined ||
  data.budgetMax >= data.budgetMin;

const budgetRangeMessage = "budgetMax must be greater than or equal to budgetMin";

export const createJobSchema = z
  .object({
    title: z.string().min(4),
    description: z.string().min(10),
    budgetMin: z.number().nonnegative(),
    budgetMax: z.number().nonnegative(),
    categoryId: z.string().min(1),
    skills: z.array(z.string().min(1)).default([])
  })
  .refine(orderedBudgetRange, {
    message: budgetRangeMessage,
    path: ["budgetMax"]
  });

export const updateJobSchema = createJobSchema.partial().refine(orderedBudgetRange, {
  message: budgetRangeMessage,
  path: ["budgetMax"]
});
