import { z } from "zod";

const jobFieldsSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const budgetRangeSchema = (schema) => schema.refine((job) => (
  job.budgetMin === undefined ||
  job.budgetMax === undefined ||
  job.budgetMax >= job.budgetMin
), {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
});

export const createJobSchema = budgetRangeSchema(jobFieldsSchema);

export const updateJobSchema = budgetRangeSchema(jobFieldsSchema.partial());
