import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const { name, email } = req.body;
  if (!name || !email) {
    const { fail } = await import("../utils/response.js");
    return fail(res, "name and email are required", 400);
  }
  return ok(res, await createUser({ name, email, role: "client" }), 201);
}
