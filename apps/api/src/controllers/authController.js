import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  const result = await registerUser(payload);
  return ok(res, result, 201);
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
  const refreshTokenValue = req.body?.refreshToken;
  if (typeof refreshTokenValue !== "string" || refreshTokenValue.length === 0) {
    return fail(res, "Invalid token", 401);
  }

  try {
    const result = await refreshToken(refreshTokenValue);
    return ok(res, result);
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
