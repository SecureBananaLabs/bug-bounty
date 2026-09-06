import { z } from 'zod';

// Shared schema for budget fields
const BudgetFields = z.object({
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
});

// Schema for job creation/validation
export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive']).default('draft'),
  budget: BudgetFields,
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// Schema for partial job updates
export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  budget: BudgetFields.optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// Helper to validate budget order
function validateBudgetOrder(budgetMin: number, budgetMax: number): boolean {
  return budgetMin <= budgetMax;
}

// Apply validation to createJobSchema
createJobSchema.refine(
  (data) => {
    const { budget } = data;
    return validateBudgetOrder(budget.budgetMin, budget.budgetMax);
  },
  {
    path: ['budget'],
    message: 'Budget range must have budgetMin <= budgetMax',
  }
);

// Apply validation to updateJobSchema when both fields are present
updateJobSchema.refine(
  (data) => {
    const { budget } = data;
    return !budget || validateBudgetOrder(budget.budgetMin, budget.budgetMax);
  },
  {
    path: ['budget'],
    message: 'Budget range must have budgetMin <= budgetMax',
  }
);