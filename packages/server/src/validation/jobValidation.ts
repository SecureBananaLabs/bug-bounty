import { z } from 'zod';

// Base job schema excluding optional fields for now
const baseJobSchema = z.object({
  title: z.string(),
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

// Schema for job creation/validation
export const createJobSchema = baseJobSchema
  .refine((data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      if (data.budgetMax < data.budgetMin) {
        throw new InvertedBudgetRangeError();
      }
    }
    return true;
  }, {
    message: 'Budget range is inverted',
    path: ['budgetMax', 'budgetMin'],
  });

// Schema for partial job updates (only validates changed fields)
export const updateJobSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
})
.refine((data) => {
  // Only apply check if both fields are present
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    if (data.budgetMax < data.budgetMin) {
      throw new InvertedBudgetRangeError();
    }
  }
  return true;
}, {
  message: 'Budget range is inverted',
  path: ['budgetMax', 'budgetMin'],
});

// Schema for parsing existing job records (strict validation)
export const parseJobSchema = baseJobSchema
  .refine((data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      if (data.budgetMax < data.budgetMin) {
        throw new InvertedBudgetRangeError();
      }
    }
    return true;
  }, {
    message: 'Budget range is inverted',
    path: ['budgetMax', 'budgetMin'],
  });