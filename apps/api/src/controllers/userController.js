import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  let payload;
  try {
    payload = createUserSchema.parse(req.body);
  } catch (err) {
    return fail(res, err.errors?.[0]?.message || "Invalid input", 400);
  }
  return ok(res, await createUser(payload), 201);
}
