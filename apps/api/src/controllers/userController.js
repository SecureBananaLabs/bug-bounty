import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res, next) {
  try {
    return ok(res, await listUsers());
  } catch (err) {
    next(err);
  }
}

export async function postUser(req, res, next) {
  try {
    const validated = createUserSchema.parse(req.body);
    const user = await createUser(validated);
    return ok(res, user, 201);
  } catch (err) {
    next(err);
  }
}
