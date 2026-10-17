/**
 * @file job.js
 * Job creation and update validation schema enforcing categoryId bounds and skills array limits.
 */

'use strict';

import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1, 'categoryId is required').max(50, 'categoryId must not exceed 50 characters'),
  skills: z.array(z.string().min(1, 'Skill cannot be empty').max(30, 'Skill must not exceed 30 characters')).max(20, 'Maximum 20 skills allowed').default([]),
});

export const updateJobSchema = createJobSchema.partial();

/**
 * Validates a job creation payload against the schema.
 *
 * @param {Object} payload
 * @returns {{ success: boolean, data?: Object, errors?: string[] }}
 */
export function validateCreateJob(payload) {
  const result = createJobSchema.safeParse(payload);
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error.errors.map((e) => e.message),
  };
}
