import { z } from 'zod';

// Shared field definitions
const positiveNumber = z.number().positive('Must be a positive number');

// Base schema for creating a job
export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  budgetMin: positiveNumber,
  budgetMax: positiveNumber,
  currency: z.string().length(3).default('USD'),
  deadline: z.string().datetime().optional(),
  // ... additional fields as needed
}).refine(
  (data) => data.budgetMax >= data.budgetMin,
  {
    message: 'budgetMax must be greater than or equal to budgetMin',
    path: ['budgetMax'],
  }
);

// Schema for partial updates (PATCH)
export const updateJobSchema = createJobSchema.partial().superRefine((data, ctx) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    if (data.budgetMax < data.budgetMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'budgetMax must be greater than or equal to budgetMin',
        path: ['budgetMax'],
      });
    }
  }
});

// Schema for job listing filters (optional, not related to budget inversion)
export const jobFilterSchema = z.object({
  minBudget: positiveNumber.optional(),
  maxBudget: positiveNumber.optional(),
  category: z.string().optional(),
}).refine(
  (data) => {
    if (data.minBudget !== undefined && data.maxBudget !== undefined) {
      return data.maxBudget >= data.minBudget;
    }
    return true;
  },
  { message: 'maxBudget must be >= minBudget in filters', path: ['maxBudget'] }
);
