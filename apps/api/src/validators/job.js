import { z } from "zod";

export const JOB_TITLE_MAX_LENGTH = 200;
export const JOB_DESCRIPTION_MAX_LENGTH = 5000;

export const createJobSchema = z.object({
  title: z.string().min(4).max(JOB_TITLE_MAX_LENGTH),
  description: z.string().min(10).max(JOB_DESCRIPTION_MAX_LENGTH),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const updateJobSchema = createJobSchema.partial();
