import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

function handleAuthError(res, error) {
  return fail(res, error.message ?? "Authentication failed", error.status ?? 500);
}

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    return handleAuthError(res, error);
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (error) {
    return handleAuthError(res, error);
  }
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
