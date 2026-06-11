import { z, RefinementCtx } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  categoryId: z.string().uuid().optional(),
  skills: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  {
    message: 'budgetMax must be greater than or equal to budgetMin',
    path: ['budgetMax'],
  }
);

export const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  budgetMax: z.number().nonnegative().optional(),
  categoryId: z.string().uuid().optional(),
  skills: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  {
    message: 'budgetMax must be greater than or equal to budgetMin',
    path: ['budgetMax'],
  }
);

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;