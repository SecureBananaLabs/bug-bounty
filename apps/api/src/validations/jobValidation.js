import { z } from 'zod';

// Reusable budget range validation
const budgetRangeRefinement = (data, ctx) => {
  if (data.budgetMin != null && data.budgetMax != null) {
    if (Number(data.budgetMax) < Number(data.budgetMin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'budgetMax must be greater than or equal to budgetMin',
        path: ['budgetMax'],
      });
      return false;
    }
  }
  return true;
};

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().uuid('Invalid category'),
  budgetMin: z.coerce.number().positive('Budget min must be positive'),
  budgetMax: z.coerce.number().positive('Budget max must be positive'),
}).superRefine(budgetRangeRefinement);

export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  budgetMin: z.coerce.number().positive().optional(),
  budgetMax: z.coerce.number().positive().optional(),
}).superRefine(budgetRangeRefinement);

export const getJobSchema = z.object({
  id: z.string().uuid('Invalid job ID'),
});
