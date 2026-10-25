import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  budgetMin: z.number().positive('budgetMin must be positive'),
  budgetMax: z.number().positive('budgetMax must be positive'),
  categoryId: z.string().uuid().optional(),
  skills: z.array(z.string()).optional(),
  // ... other fields as defined in the original schema
}).refine(
  (data) => data.budgetMax >= data.budgetMin,
  {
    message: 'budgetMax must be greater than or equal to budgetMin',
    path: ['budgetMax'],
  }
);

export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  skills: z.array(z.string()).optional(),
  // ... other optional fields
}).refine(
  (data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  {
    message: 'budgetMax must be greater than or equal to budgetMin when both are provided',
    path: ['budgetMax'],
  }
);
