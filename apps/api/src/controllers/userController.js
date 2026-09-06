import { z } from 'zod';
import { createUser } from '../services/userService.js';
import { ok } from '../utils/response.js';

const postUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'admin']).optional().default('user'),
}).strict(); // Reject unknown fields like 'id'

export async function postUser(req, res) {
  const parsed = postUserSchema.parse(req.body);
  return ok(res, await createUser(parsed), 201);
}
