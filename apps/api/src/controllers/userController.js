import { ok } from "../utils/response.js";
import { registerUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  return ok(res, await registerUser(req.body), 201);
}
