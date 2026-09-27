import { z } from "zod";

const budgetSchema = z.number().finite().nonnegative();

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: budgetSchema,
  budgetMax: budgetSchema,
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const updateJobSchema = createJobSchema.partial();
