import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  const users = await listUsers();
  const sanitized = users.map(({ password, ...rest }) => rest);
  return ok(res, sanitized);
}

export async function postUser(req, res) {
  return ok(res, await createUser(req.body), 201);
}
