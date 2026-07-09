import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res, next) {
  try {
    return ok(res, await listUsers());
  } catch (error) {
    next(error);
  }
}

export async function postUser(req, res, next) {
  try {
    const payload = createUserSchema.parse(req.body);
    const result = await createUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    next(error);
  }
}
