import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  categoryId: z.string().uuid(),
  skills: z.array(z.string()).min(1).max(10),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: 'budgetMax must be greater than or equal to budgetMin',
  path: ['budgetMax'],
});

export const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  location: z.string().min(1).max(200).optional(),
  categoryId: z.string().uuid().optional(),
  skills: z.array(z.string()).min(1).max(10).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
}).refine((data) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: 'budgetMax must be greater than or equal to budgetMin',
  path: ['budgetMax'],
});