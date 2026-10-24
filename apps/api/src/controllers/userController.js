import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return fail(res, "Invalid user payload", 400);
  }

  return ok(res, await createUser(parsed.data), 201);
}
