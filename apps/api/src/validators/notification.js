/**
 * @file notification.js
 * Notification creation payload validation schema enforcing non-empty userId, title (min 2 chars), and body (min 2 chars).
 */

'use strict';

import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z
    .string({
      required_error: 'userId is required',
      invalid_type_error: 'userId must be a string',
    })
    .min(1, 'userId is required'),
  title: z
    .string({
      required_error: 'title is required',
      invalid_type_error: 'title must be a string',
    })
    .min(2, 'title must be at least 2 characters')
    .max(200, 'title must not exceed 200 characters'),
  body: z
    .string({
      required_error: 'body is required',
      invalid_type_error: 'body must be a string',
    })
    .min(2, 'body must be at least 2 characters')
    .max(2000, 'body must not exceed 2000 characters'),
  type: z.string().optional(),
});

/**
 * Validates a notification creation payload.
 *
 * @param {Object} payload
 * @returns {{ valid: boolean, data?: Object, error?: string, errors?: string[] }}
 */
export function validateCreateNotification(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Invalid notification payload',
      errors: ['Invalid notification payload'],
    };
  }

  const result = createNotificationSchema.safeParse(payload);
  if (result.success) {
    return {
      valid: true,
      data: result.data,
    };
  }

  const errors = result.error.errors.map((e) => e.message);
  return {
    valid: false,
    error: errors[0],
    errors,
  };
}
