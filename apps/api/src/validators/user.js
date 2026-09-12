const { z } = require('zod');

/**
 * Validation schema for POST /api/users.
 *
 * - Requires a valid email and a non-empty full name.
 * - role defaults to 'client' and only allows 'client' or 'freelancer',
 *   so callers cannot self-assign privileged roles (e.g. 'admin').
 * - Unknown fields are stripped before the payload reaches the service layer.
 */
const createUserSchema = z.object({
  email: z
    .string({ required_error: 'email is required' })
    .trim()
    .toLowerCase()
    .email('email must be a valid email address'),
  fullName: z
    .string({ required_error: 'fullName is required' })
    .trim()
    .min(1, 'fullName must not be empty'),
  password: z.string().min(1, 'password must not be empty').optional(),
  role: z
    .enum(['client', 'freelancer'], {
      errorMap: () => ({ message: 'role must be either client or freelancer' }),
    })
    .default('client'),
});

module.exports = { createUserSchema };
