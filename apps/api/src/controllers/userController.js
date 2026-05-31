import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const { email, name } = req.body;
  if (!email || !name) {
    return fail(res, "Email and name are required", 400);
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return fail(res, "Valid email is required", 400);
  }
  if (typeof name !== "string" || name.length < 2) {
    return fail(res, "Name must be at least 2 characters", 400);
  }
  return ok(res, await createUser(req.body), 201);
}
