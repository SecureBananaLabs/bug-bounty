import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

const allowedRoles = new Set(["client", "freelancer", "admin"]);

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const { email, role = "client" } = req.body ?? {};

  if (typeof email !== "string" || !email.includes("@")) {
    return fail(res, "Valid email is required", 400);
  }

  if (typeof role !== "string" || !allowedRoles.has(role)) {
    return fail(res, "Invalid role", 400);
  }

  return ok(res, await createUser({ ...req.body, role }), 201);
}
