import { ok } from "../utils/response.js";
import { userSchema } from "../validators/user.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const payload = userSchema.parse(req.body);
  return ok(res, await createUser(payload), 201);
}