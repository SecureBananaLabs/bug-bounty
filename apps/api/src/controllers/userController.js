import { ok } from '../utils/response.js';
import { createUserSchema } from '../validators/user.js';
import { createUser, listUsers } from '../services/userService.js';

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  try {
    const payload = createUserSchema.parse(req.body);
    return ok(res, await createUser(payload), 201);
  } catch (error) {
    return error.response(res, error.errors);
  }
}