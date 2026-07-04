import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res, next) {
  try {
    const parsed = createUserSchema.parse(req.body);
    return ok(res, await createUser(parsed), 201);
  } catch (error) {
    next(error);
  }
}
