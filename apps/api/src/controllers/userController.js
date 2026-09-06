import { ok, fail } from "../utils/response.js";
import { createUser, listUsers, getUserByUsername } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function getUserProfile(req, res) {
  const { username } = req.params;
  const user = await getUserByUsername(username);
  if (!user) {
    return fail(res, "User not found", 404);
  }
  return ok(res, user);
}

export async function postUser(req, res) {
  return ok(res, await createUser(req.body), 201);
}

