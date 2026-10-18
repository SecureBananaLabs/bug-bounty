import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { validateCreateUser } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const result = validateCreateUser(req.body);
  if (!result.valid) {
    return fail(res, result.error, 400);
  }
  return ok(res, await createUser(result.data), 201);
}
