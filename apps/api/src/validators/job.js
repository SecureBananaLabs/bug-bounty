import { z } from "zod";

const budgetRangeIsOrdered = ({ budgetMin, budgetMax }) =>
  budgetMin === undefined || budgetMax === undefined || budgetMax >= budgetMin;

const jobFields = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobFields.refine(budgetRangeIsOrdered, {
  path: ["budgetMax"],
  message: "budgetMax must be greater than or equal to budgetMin"
});

export const updateJobSchema = jobFields.partial().refine(budgetRangeIsOrdered, {
  path: ["budgetMax"],
  message: "budgetMax must be greater than or equal to budgetMin"
});
