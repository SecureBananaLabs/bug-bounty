import { z } from 'zod';

// Define the job creation schema with budget validation
export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  budgetMin: z.number().min(0, 'Budget minimum must be non-negative'),
  budgetMax: z.number()
    .min(z.number().optional(), { message: 'Budget maximum must be greater than or equal to budget minimum' })
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
    .min(z.number().optional(), { message: 'Budget maximum must be greater than or equal to budget minimum' })
    .refine((val, ctx) => val >= ctx.parent.budgetMin, {
      message: 'Budget maximum must be greater than or equal to budget minimum',
    }).optional(),
  // ... other fields
});

// Base job schema (for parsing existing valid records)
export const jobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
});