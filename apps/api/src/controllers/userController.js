import { createUserSchema } from "../validators/user.js";
import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.issues[0]?.message ?? "Invalid user", 400);
  }

  return ok(res, await createUser(parsed.data), 201);
}
