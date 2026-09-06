import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

const VALID_ROLES = ["freelancer", "client"];

export async function postUser(req, res) {
  const { email, name, role } = req.body || {};

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return fail(res, "Valid email is required.", 400);
  }
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return fail(res, "Name must be at least 2 characters.", 400);
  }
  if (role && !VALID_ROLES.includes(role)) {
    return fail(res, `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`, 400);
  }

  return ok(res, await createUser(req.body), 201);
}
