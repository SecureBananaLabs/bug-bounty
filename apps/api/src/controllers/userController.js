import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const payload = createUserSchema.safeParse(req.body);
  if (!payload.success) {
    return fail(res, "Invalid user payload", 400);
  }

  return ok(res, await createUser(payload.data), 201);
}
