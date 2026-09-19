import { ok } from '../utils/response.js';
import { createUserSchema } from '../validators/user.js';
import { createUser, listUsers } from '../services/userService.js';

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const { error } = createUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  const user = await createUser({ name: req.body.name, email: req.body.email, role: req.body.role });
  return ok(res, user, 201);
}