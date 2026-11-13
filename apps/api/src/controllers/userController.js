import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  try {
    return ok(res, await createUser(req.body), 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
}
