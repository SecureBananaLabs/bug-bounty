import { z } from 'zod';

// Base job schema with budget validation
export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0).refine(
    (value, ctx) => value >= ctx.parent.budgetMin,
    'budgetMax must be greater than or equal to budgetMin'
  ),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  location: z.string().optional(),
  startDate: z.string().optional().datetime(),
  endDate: z.string().optional().datetime(),
});

// Update schema that also validates budget consistency
export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  location: z.string().optional(),
  startDate: z.string().optional().datetime(),
  endDate: z.string().optional().datetime(),
}).refine(
  (data) => {
    // If both fields are present, ensure order
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

// Combined schema for both creation and update
export const jobSchema = z.union([
  createJobSchema,
  updateJobSchema,
]);

// Parse helper
export function parseJob(input: any) {
  try {
    return jobSchema.parse(input);
  } catch (error) {
    const message = error.message || 'Invalid job data';
    throw new Error(message);
  }
}