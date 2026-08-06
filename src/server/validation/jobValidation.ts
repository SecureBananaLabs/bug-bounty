import { z } from 'zod';

// Define a reusable schema for budget range fields
const BudgetRangeSchema = z.object({
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
});

// Job creation schema with explicit validation for budget order
export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  // Ensure budgetMax is not less than budgetMin
  // This will reject inverted ranges at creation time
  budget: BudgetRangeSchema.refine(
    ({ budgetMin, budgetMax }) => budgetMin !== undefined && budgetMax !== undefined
      ? budgetMin <= budgetMax
      : true,
    {
      message: 'budgetMin must not be greater than budgetMax',
      path: ['budget'],
    }
  ),
});

// Job update schema - also validates budget order when both fields are present
export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  // Re-validate budget order on partial updates
  budget: BudgetRangeSchema.refine(
    ({ budgetMin, budgetMax }) => budgetMin !== undefined && budgetMax !== undefined
      ? budgetMin <= budgetMax
      : true,
    {
      message: 'budgetMin must not be greater than budgetMax',
      path: ['budget'],
    }
  ),
});