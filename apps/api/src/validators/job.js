/**
 * @file job.js
 * Job creation and update validation schema enforcing categoryId bounds, skills array limits, and budget range invariant.
 */

'use strict';

import { z } from 'zod';

const baseJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1, 'categoryId is required').max(50, 'categoryId must not exceed 50 characters'),
  skills: z.array(z.string().min(1, 'Skill cannot be empty').max(30, 'Skill must not exceed 30 characters')).max(20, 'Maximum 20 skills allowed').default([]),
});

export const createJobSchema = baseJobSchema.refine((data) => data.budgetMax >= data.budgetMin, {
  message: 'budgetMax must be greater than or equal to budgetMin',
  path: ['budgetMax'],
});

export const updateJobSchema = baseJobSchema.partial();

/**
 * Validates a job creation payload against the schema.
 *
 * @param {Object} payload
 * @returns {{ success: boolean, valid: boolean, data?: Object, error?: string, errors?: string[] }}
 */
export function validateCreateJob(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      valid: false,
      error: 'Valid job payload is required',
      errors: ['Valid job payload is required'],
    };
  }

  const result = createJobSchema.safeParse(payload);
  if (result.success) {
    return {
      success: true,
      valid: true,
      data: result.data,
    };
  }

  const errors = result.error.errors.map((e) => e.message);
  return {
    success: false,
    valid: false,
    error: errors[0],
    errors,
  };
}
