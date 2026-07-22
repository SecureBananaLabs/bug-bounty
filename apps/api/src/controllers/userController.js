import { ok } from "../utils/response.js";
import { createUserSchema } from "../validators/user.js";
import { createUser, listUsers } from "../services/userService.js";
import { fail } from "../utils/response.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  let payload;

  try {
    payload = createUserSchema.parse(req.body);
  } catch {
    return fail(res, "Invalid user payload", 400);
  }

  return ok(res, await createUser(payload), 201);
}
