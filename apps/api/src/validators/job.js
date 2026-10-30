import { z } from "zod";

const jobFieldsSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const budgetRangeSchema = (schema) => schema.refine(
  ({ budgetMin, budgetMax }) =>
    budgetMin === undefined || budgetMax === undefined || budgetMax >= budgetMin,
  {
    message: "budgetMax must be greater than or equal to budgetMin",
    path: ["budgetMax"]
  }
);

export const createJobSchema = budgetRangeSchema(jobFieldsSchema);

export const updateJobSchema = budgetRangeSchema(jobFieldsSchema.partial());
