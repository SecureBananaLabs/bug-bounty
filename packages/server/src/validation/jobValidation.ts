import { z } from 'zod';

// Base job schema excluding optional fields for validation
const baseJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  // ... other fields
});

// Custom error for inverted budget range
class InvertedBudgetRangeError extends Error {
  constructor() {
    super('Budget range is inverted: budgetMax must be greater than or equal to budgetMin');
  }
}

// Validate budget range
function validateBudgetRange(job: any) {
  const { budgetMin, budgetMax } = job;

  if (budgetMin !== undefined && budgetMax !== undefined && budgetMax < budgetMin) {
    throw new InvertedBudgetRangeError();
  }
}

// Full job creation schema
export const createJobSchema = baseJobSchema.extend({
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
}).superRefine((data, ctx) => {
  validateBudgetRange(data);
});

// Job update schema (partial update)
export const updateJobSchema = baseJobSchema.partial().extend({
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
}).superRefine((data, ctx) => {
  // Only validate if both fields are present in the update
  if (data.budgetMin !== undefined && data.budgetMax !== undefined && data.budgetMax < data.budgetMin) {
    ctx.addError({
      path: ['budgetMax'],
      message: 'Budget range is inverted: budgetMax must be greater than or equal to budgetMin',
    });
  }
});

// Job input schema for API routes
export const jobInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
});

// Job output schema for responses
export const jobOutputSchema = baseJobSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});