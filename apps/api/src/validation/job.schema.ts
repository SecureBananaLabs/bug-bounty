import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
}).refine(data => {
  // If both budget fields are present, ensure budgetMin <= budgetMax
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMin <= data.budgetMax;
  }
  return true;
}, {
  message: 'budgetMin must be less than or equal to budgetMax',
  path: ['budgetMax']
});

export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
}).refine(data => {
  // If both budget fields are present, ensure budgetMin <= budgetMax
  if (data.budgetMin !== undefined && data.budgetMax !== 0) {
    return data.budgetMin <= data.budgetMax;
  }
  return true;
});