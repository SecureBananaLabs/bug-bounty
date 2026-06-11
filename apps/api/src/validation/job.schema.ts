import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1).max(255),
  categoryId: z.string().uuid(),
  skills: z.array(z.string()).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
}).strict().refine((data) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: 'budgetMax must be greater than or equal to budgetMin',
});

export const updateJobSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  categoryId: z.string().uuid().optional(),
  skills: z.array(z.string()).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
}).strict().refine((data) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}, {
  message: 'budgetMax must be greater than or equal to budgetMin',
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;