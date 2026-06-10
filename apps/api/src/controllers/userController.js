import { ok, fail } from "../utils/response.js";
import { createUser, listUsers, getUserByUsername } from "../services/userService.js";

export async function getUsers(req, res) {
  try {
    return ok(res, await listUsers());
  } catch (e) {
    return fail(res, e.message, 500);
  }
}

export async function postUser(req, res) {
  try {
    const result = await createUser(req.body);
    return ok(res, result, 201);
  } catch (e) {
    return fail(res, e.message, 400);
  }
}

export async function getUserProfile(req, res) {
  try {
    const { username } = req.params;
    const user = await getUserByUsername(username);
    if (!user) {
      return fail(res, "User not found", 404);
    }
    return ok(res, user);
  } catch (e) {
    return fail(res, e.message, 500);
  }
}
