import { createUserSchema } from "../validators/user.js";
import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const payload = createUserSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(res, "Invalid user request", 400);
  }

  return ok(res, await createUser(payload.data), 201);
}
