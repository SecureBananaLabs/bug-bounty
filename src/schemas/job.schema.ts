# Fix for Issue #2853: Job validation should reject inverted budget ranges

import { z } from 'zod';

/**
 * Base job fields schema without cross-field validation
 */
const jobFieldsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be 5000 characters or less'),
  budgetMin: z.number().positive('Budget minimum must be a positive number'),
  budgetMax: z.number().positive('Budget maximum must be a positive number'),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  deadline: z.string().datetime().optional(),
  remote: z.boolean().optional().default(true),
});

/**
 * Validates that budgetMax is greater than or equal to budgetMin
 */
const validateBudgetRange = <T extends { budgetMin?: number; budgetMax?: number }>(
  data: T,
  ctx: z.RefinementCtx
): void => {
  if (
    data.budgetMin !== undefined &&
    data.budgetMax !== undefined &&
    data.budgetMax < data.budgetMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Budget maximum must be greater than or equal to budget minimum',
      path: ['budgetMax'],
    });
  }
};

/**
 * Schema for creating a new job posting
 * Enforces that budgetMax >= budgetMin
 */
export const createJobSchema = jobFieldsSchema.superRefine(validateBudgetRange);

/**
 * Schema for partial job updates
 * All fields are optional, but if both budget fields are present,
 * validates that budgetMax >= budgetMin
 */
export const updateJobSchema = jobFieldsSchema
  .partial()
  .superRefine(validateBudgetRange);

/**
 * Schema for patching specific job fields
 * Validates budget range only when both fields are provided in the patch
 */
export const patchJobSchema = jobFieldsSchema
  .partial()
  .superRefine(validateBudgetRange);

// Type exports for use in handlers/services
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type PatchJobInput = z.infer<typeof patchJobSchema>;