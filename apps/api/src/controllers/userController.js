import { registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

// Registration validation schema should be imported
// For now, assuming it's in a validation file
// The main fix would be to update the validation and service

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  return ok(res, await createUser(req.body), 201);
}

export async function postRegister(req, res) {
  // This would be the registration endpoint
  // Implementation would be added to handle registration with fullName validation
}
}
