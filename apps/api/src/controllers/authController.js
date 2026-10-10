import { registerSchema, loginSchema } from "../validators/auth.js";
import { DuplicateEmailError, loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  try {
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return fail(res, error.message, 409);
    }
    throw error;
  }
}

export async function login(req, res) {
  const payload = loginSchema.parse(req.body);
  const result = await loginUser(payload);
  return ok(res, result);
}

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  const result = await refreshToken();
  return ok(res, result);
}
