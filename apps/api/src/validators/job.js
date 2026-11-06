import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().min(10).max(5000),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1).max(100),
  skills: z.array(z.string().min(1).max(80)).max(25).default([])
});

export const updateJobSchema = createJobSchema.partial();
