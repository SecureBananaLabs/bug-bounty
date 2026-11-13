import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  const { name, email, password } = result.data;
  return ok(res, await createUser({ name, email, password }), 201);
}
