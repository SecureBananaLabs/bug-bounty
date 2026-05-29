import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  try {
    const result = await createUser(req.body);
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}
