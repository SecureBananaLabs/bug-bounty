import { z } from 'zod';

// Define the job creation schema with budget validation
export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  budgetMin: z.number().min(0, 'Budget minimum must be non-negative'),
  budgetMax: z.number()
    .min(z.number().pipe(z.coerce.number().gte(0)), 'Budget maximum must be non-negative')
    .refine((val, ctx) => val >= ctx.parent.budgetMin, {
      message: 'Budget maximum must be greater than or equal to budget minimum',
    }),
  // ... other fields
});

// Define the partial update schema with budget validation
export const updateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  budgetMin: z.number().min(0, 'Budget minimum must be non-negative').optional(),
  budgetMax: z.number()
    .min(z.number().pipe(z.coerce.number().gte(0)), 'Budget maximum must be non-negative')
    .refine((val, ctx) => {
      if (ctx.parent.budgetMin !== undefined && ctx.parent.budgetMax !== undefined) {
        return val >= ctx.parent.budgetMin;
      }
      return true;
    }, {
      message: 'Budget maximum must be greater than or equal to budget minimum',
    }).optional(),
  // ... other fields
});

// Define the job schema for parsing existing records
export const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  budgetMin: z.number().min(0, 'Budget minimum must be non-negative'),
  budgetMax: z.number()
    .min(z.number().pipe(z.coerce.number().gte(0)), 'Budget maximum must be non-negative')
    .refine((val, ctx) => val >= ctx.parent.budgetMin, {
      message: 'Budget maximum must be greater than or equal to budget minimum',
    }),
  // ... other fields
});