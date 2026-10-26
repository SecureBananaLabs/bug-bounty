import { ok, fail } from "../utils/response.js";
import { createUserSchema } from "../validators/user.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return fail(res, message, 400);
  }
  return ok(res, await createUser(parsed.data), 201);
}
