import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { registerUser } from "../services/authService.js";
import { validateRegistration } from "../validators/registrationValidator.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  return ok(res, await createUser(req.body), 201);
}

export async function register(req, res) {
  try {
    const validatedData = await validateRegistration(req.body);
    const user = await registerUser({
      ...validatedData,
      fullName: validatedData.fullName
    });
    return ok(res, user, 201);
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}
