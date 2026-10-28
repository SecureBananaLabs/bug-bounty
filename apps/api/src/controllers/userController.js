import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const { id: _ignoredId, role = "client", ...payload } = req.body ?? {};

  if (role === "admin" && req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }

  return ok(res, await createUser({ ...payload, role }), 201);
}
