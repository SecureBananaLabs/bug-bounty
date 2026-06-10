import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  const users = await listUsers();
  return ok(res, users);
}

export async function postUser(req, res) {
  const user = await createUser(req.body);
  return ok(res, user, 201);
}
