import { z } from 'zod';

/**
 * Schema for creating a job.
 * - budgetMin and budgetMax are optional numeric fields.
 * - When both are provided, budgetMax must be >= budgetMin.
 */
export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().optional(),
  skills: z.array(z.string()).optional(),
  budgetMin: z.number().nonnegative('Budget min must be non-negative').optional(),
  budgetMax: z.number().nonnegative('Budget max must be non-negative').optional(),
  currency: z.string().optional(),
  duration: z.string().optional(),
  experienceLevel: z.string().optional(),
  status: z.enum(['open', 'closed', 'draft']).optional(),
}).refine(
  (data) => {
    // If both budget fields are present, max must be >= min
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

/**
 * Schema for updating a job (partial update).
 * - All fields are optional.
 * - When both budgetMin and budgetMax are provided in the payload,
 *   budgetMax must be >= budgetMin.
 */
export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().optional(),
  skills: z.array(z.string()).optional(),
  budgetMin: z.number().nonnegative('Budget min must be non-negative').optional(),
  budgetMax: z.number().nonnegative('Budget max must be non-negative').optional(),
  currency: z.string().optional(),
  duration: z.string().optional(),
  experienceLevel: z.string().optional(),
  status: z.enum(['open', 'closed', 'draft']).optional(),
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
