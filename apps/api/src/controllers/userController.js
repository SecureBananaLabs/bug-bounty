import { ok } from "../utils/response.js";
import { createUserSchema } from "../validators/user.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res, next) {
  try {
    const validated = createUserSchema.parse(req.body);
    const user = await createUser(validated);
    return ok(res, user, 201);
  } catch (err) {
    return next(err);
  }
}
