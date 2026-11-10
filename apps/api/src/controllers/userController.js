import { ok, badRequest } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return badRequest(res, result.error.errors);
  }
  return ok(res, await createUser(result.data), 201);
}
