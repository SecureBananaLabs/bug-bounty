import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return fail(res, "Request body is required", 400);
  }

  return ok(res, await createUser(req.body), 201);
}
