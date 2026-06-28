import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string(),
  description: z.string(),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive()
}).refine(data => data.budgetMax >= data.budgetMin, {
  message: 'budgetMax must be greater than or equal to budgetMin',
  path: ['budgetMax']
});

export const updateJobSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional()
}).refine(data => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: 'budgetMax must be greater than or equal to budgetMin',
  path: ['budgetMax']
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;