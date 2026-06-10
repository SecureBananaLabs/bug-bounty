import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { registerUser } from "../services/authService.js";
import { validateRegistration } from "../validators/authValidator.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  return ok(res, await createUser(req.body), 201);
}

export async function register(req, res) {
  try {
    const userData = await validateRegistration(req.body);
    return ok(res, await registerUser(userData), 201);
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}

export async function postUser(req, res) {
  return ok(res, await createUser(req.body), 201);
}
