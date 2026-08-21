import { ok, fail } from "../utils/response.js";
import { validateCreateUser } from "../validators/user.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const validation = validateCreateUser(req.body);
  if (!validation.ok) {
    return fail(res, validation.error, 400);
  }
  return ok(res, await createUser(validation.data), 201);
}

