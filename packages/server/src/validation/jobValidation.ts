import { z } from 'zod';

// Base job schema excluding optional fields for stricter validation
const baseJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  type: z.enum(['full-time', 'part-time', 'contract']).optional(),
  postedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Schema for budget fields with validation against each other
const budgetSchema = z.object({
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0).refine((val, ctx) => val >= ctx.parent.budgetMin, {
    message: 'budgetMax must be greater than or equal to budgetMin',
  }),
});

// Full job creation schema
export const createJobSchema = baseJobSchema.extend({
  budget: budgetSchema.optional(),
  skills: z.array(z.string()).optional(),
  employer: z.string().optional(),
  remote: z.boolean().optional(),
});

// Schema for partial updates that preserve existing valid order
export const updateJobSchema = baseJobSchema.extend({
  budget: z.union([
    z.object({ budgetMin: z.number().min(0), budgetMax: z.number().min(0) }).refine(
      (val, ctx) => val.budgetMax >= val.budgetMin,
      { message: 'budgetMax must be greater than or equal to budgetMin' }
    ),
    z.literal(undefined),
  ]).optional(),
  skills: z.array(z.string()).optional(),
  employer: z.string().optional(),
  remote: z.boolean().optional(),
});