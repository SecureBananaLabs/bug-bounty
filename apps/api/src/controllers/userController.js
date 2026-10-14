import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { userSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.flatten(), 422);
  }
  return ok(res, await createUser(result.data), 201);
}
