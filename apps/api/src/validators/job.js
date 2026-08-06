import { z } from "zod";

const budgetRangeMessage = "budgetMax must be greater than or equal to budgetMin";

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobSchema.refine(
  (job) => job.budgetMax >= job.budgetMin,
  {
    message: budgetRangeMessage,
    path: ["budgetMax"]
  }
);

export const updateJobSchema = jobSchema.partial().refine(
  (job) =>
    job.budgetMin === undefined ||
    job.budgetMax === undefined ||
    job.budgetMax >= job.budgetMin,
  {
    message: budgetRangeMessage,
    path: ["budgetMax"]
  }
);
