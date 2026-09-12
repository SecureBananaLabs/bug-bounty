/**
 * @file message.js
 * Message creation validation schema enforcing non-empty recipientId and content bounds (1 to 5000 characters).
 */

'use strict';

import { z } from 'zod';

export const createMessageSchema = z.object({
  recipientId: z
    .string({
      required_error: 'recipientId is required',
      invalid_type_error: 'recipientId must be a string',
    })
    .min(1, 'recipientId is required'),
  content: z
    .string({
      required_error: 'content is required',
      invalid_type_error: 'content must be a string',
    })
    .min(1, 'content must be at least 1 character')
    .max(5000, 'content must not exceed 5000 characters'),
  conversationId: z.string().optional(),
});

/**
 * Validates a message creation payload.
 *
 * @param {Object} payload
 * @returns {{ valid: boolean, data?: Object, error?: string, errors?: string[] }}
 */
export function validateCreateMessage(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Invalid message payload',
      errors: ['Invalid message payload'],
    };
  }

  const result = createMessageSchema.safeParse(payload);
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
