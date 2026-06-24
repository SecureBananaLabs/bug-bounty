import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { userSchema, filterSystemFields } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid input", 400, parsed.error.issues);
  }

  const clean = filterSystemFields(parsed.data);

  return ok(res, await createUser(clean), 201);
}
