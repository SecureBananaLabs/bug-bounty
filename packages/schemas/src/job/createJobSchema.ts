import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  categoryId: z.string().min(1),
  skills: z.array(z.string()).min(1),
  duration: z.string().min(1),
  experienceLevel: z.string().min(1),
}).refine(data => data.budgetMax >= data.budgetMin, {
  message: "Budget maximum must be greater than or equal to budget minimum",
  path: ["budgetMax"],
});