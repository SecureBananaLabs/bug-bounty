import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const { role } = req.body || {};
  if (role === "admin" || role === "master_admin") {
    return fail(res, "Admin-level roles cannot be self-assigned.", 403);
  }
  return ok(res, await createUser(req.body), 201);
}
