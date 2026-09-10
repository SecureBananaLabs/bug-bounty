import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative().finite(),
  budgetMax: z.number().nonnegative().finite(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([]),
});

export const updateJobSchema = createJobSchema.partial();
