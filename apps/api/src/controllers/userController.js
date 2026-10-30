import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res, next) {
  try {
    const validated = createUserSchema.parse(req.body);
    const result = await createUser(validated);
    return ok(res, result, 201);
  } catch (err) {
    return next(err);
  }
}
