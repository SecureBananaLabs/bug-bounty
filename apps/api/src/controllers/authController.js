import { registerSchema, loginSchema } from "../validators/auth.js";
import { fail, ok } from "../utils/response.js";
import { loginUser, refreshTokenWithCredential, registerUser } from "../services/authService.js";

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
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    const result = await refreshTokenWithCredential(authHeader.slice(7));
    return ok(res, result);
  } catch {
    return fail(res, "Invalid refresh token", 401);
  }
}
