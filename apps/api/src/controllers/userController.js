import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const result = await createUser(req.body);
  if (result.__validationError) {
    return fail(res, result.__validationError, 400);
  }
  return ok(res, result, 201);
}
