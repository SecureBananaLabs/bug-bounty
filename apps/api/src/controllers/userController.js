import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

const REQUIRED_USER_FIELDS = ["name", "email"];

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const missing = REQUIRED_USER_FIELDS.filter(f => !req.body[f]);
  if (missing.length) {
    return fail(res, `Missing required fields: ${missing.join(", ")}`, 400);
  }
  return ok(res, await createUser(req.body), 201);
}
