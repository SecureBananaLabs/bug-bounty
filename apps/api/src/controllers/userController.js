import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { registerSchema } from "../validators/auth.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  // Validate and allowlist fields using the registration schema rather than
  // passing raw req.body to createUser, which would allow arbitrary fields
  // (role, isAdmin, creditBalance, etc.) to be set by the caller.
  const payload = registerSchema.parse(req.body);
  return ok(res, await createUser(payload), 201);
}
