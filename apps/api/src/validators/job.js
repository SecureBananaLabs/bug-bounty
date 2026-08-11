import { z } from "zod";

const skillSchema = z.string().trim().min(1).max(32);

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(skillSchema).max(20).default([]).transform((skills) => [...new Set(skills)])
});

export const updateJobSchema = createJobSchema.partial();
