<content>
import { ok, badRequest } from '../utils/response.js';
import { createUserSchema } from '../validators/user.js';
import { createUser } from '../services/userService.js';

export async function postUser(req, res) {
  try {
    const payload = createUserSchema.parse(req.body);
    return ok(res, await createUser(payload), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(res, error.message);
    }
    throw error;
  }
}

export async function getUser(req, res) {
  // Implementation
}

export async function putUser(req, res) {
  // Implementation
}

export async function deleteUser(req, res) {
  // Implementation
}