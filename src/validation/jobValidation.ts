import { z } from 'zod';

// Define a reusable schema for budget fields with ordering constraint
const BudgetFields = z.object({
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0).refine((val, ctx) => val >= ctx.parent.budgetMin, {
    message: 'budgetMax must be greater than or equal to budgetMin',
  }),
});

// Main job schema that uses the budget fields
export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0).refine((val, ctx) => val >= ctx.parent.budgetMin, {
    message: 'budgetMax must be greater than or equal to budgetMin',
  }),
  // ... other fields
});

// Schema for partial updates that also enforces the same constraint
export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional().refine((val, ctx) => {
    if (!ctx.parent.budgetMin || !val) return true;
    return val >= ctx.parent.budgetMin;
  }, {
    message: 'budgetMax must be greater than or equal to budgetMin',
  }),
  // ... other optional fields
});