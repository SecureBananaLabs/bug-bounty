import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
}).refine(data => data.budgetMin <= data.budgetMax, {
  message: 'budgetMin must be less than or equal to budgetMax',
  path: ['budgetMax'],
});