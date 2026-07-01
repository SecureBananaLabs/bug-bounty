import { createUserSchema } from "../validators/user.js";
import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  return ok(res, await createUser(createUserSchema.parse(req.body)), 201);
}
