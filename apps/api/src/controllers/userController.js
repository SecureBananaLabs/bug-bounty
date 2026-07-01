import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { registerSchema } from "../validators/auth.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const payload = registerSchema.parse(req.body);
  return ok(res, await createUser(payload), 201);
}
