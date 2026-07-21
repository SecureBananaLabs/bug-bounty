import { z } from 'zod';

export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  categoryId: z.string().min(1).optional(),
  skills: z.array(z.string()).min(1).optional(),
  duration: z.string().min(1).optional(),
  experienceLevel: z.string().min(1).optional(),
}).refine(data => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: "Budget maximum must be greater than or equal to budget minimum",
  path: ["budgetMax"],
});