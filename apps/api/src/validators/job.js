import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().trim().min(4),
  description: z.string().trim().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().trim().min(1),
  skills: z.array(z.string().trim().min(1)).default([])
});

export const updateJobSchema = createJobSchema.partial();
