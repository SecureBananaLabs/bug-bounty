# Fix for Issue #2853: Job validation should reject inverted budget ranges

import { z } from 'zod';

/**
 * Base job schema fields without cross-field validations
 */
const jobBaseFields = {
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be 5000 characters or less'),
  budgetMin: z.number().nonnegative('Budget minimum must be non-negative'),
  budgetMax: z.number().nonnegative('Budget maximum must be non-negative'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  deadline: z.string().datetime().optional(),
  contactEmail: z.string().email('Invalid email address'),
};

/**
 * Validates that budgetMax is not less than budgetMin when both are present
 */
function validateBudgetRange(data: { budgetMin?: number; budgetMax?: number }): boolean {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    return data.budgetMax >= data.budgetMin;
  }
  return true;
}

const budgetRangeError = {
  message: 'Budget maximum must be greater than or equal to budget minimum',
  path: ['budgetMax'],
};

/**
 * Schema for creating a new job - all required fields must be present
 */
export const createJobSchema = z
  .object(jobBaseFields)
  .refine(validateBudgetRange, budgetRangeError);

/**
 * Schema for updating an existing job - all fields are optional
 * Budget range validation applies when both budget fields are provided
 */
export const updateJobSchema = z
  .object({
    title: jobBaseFields.title.optional(),
    description: jobBaseFields.description.optional(),
    budgetMin: jobBaseFields.budgetMin.optional(),
    budgetMax: jobBaseFields.budgetMax.optional(),
    currency: jobBaseFields.currency.optional(),
    tags: jobBaseFields.tags,
    deadline: jobBaseFields.deadline,
    contactEmail: jobBaseFields.contactEmail.optional(),
  })
  .refine(validateBudgetRange, budgetRangeError);

/**
 * Schema for partial job updates (PATCH) - same as update but explicitly partial
 */
export const patchJobSchema = updateJobSchema;

// Type exports for use in controllers and services
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type PatchJobInput = z.infer<typeof patchJobSchema>;