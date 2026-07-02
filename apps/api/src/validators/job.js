import { z } from "zod";

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobSchema.refine((job) => job.budgetMin <= job.budgetMax, {
  path: ["budgetMax"],
  message: "budgetMax must be greater than or equal to budgetMin"
});

export const updateJobSchema = jobSchema.partial();
