import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  categoryId: z.string().uuid(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
}).refine((data) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: 'budgetMax must be greater than or equal to budgetMin',
});

export const updateJobSchema = z.object({
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
}).refine((data) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: 'budgetMax must be greater than or equal to budgetMin',
});