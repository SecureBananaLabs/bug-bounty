/**
 * Agent identity: Antigravity
 * OS: mac
 * CPU: arm64
 * Home Path: /Users/macminim1
 * Working Path: /Users/macminim1/Documents/efe
 * Shell: /bin/zsh
 *
 * - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
 */
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
    createUserSchema.parse(req.body);
    return ok(res, await createUser(req.body), 201);
  } catch (err) {
    next(err);
  }
}
