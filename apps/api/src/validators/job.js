import { z } from "zod";

const skillSchema = z.string().trim().min(1).max(40);

const skillsSchema = z.array(skillSchema)
  .max(20)
  .transform((skills) => [...new Set(skills)])
  .default([]);

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: skillsSchema
});

export const updateJobSchema = createJobSchema.partial();
