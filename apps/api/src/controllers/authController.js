import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

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
    return fail(res, "Refresh token required", 401);
  }
  const result = await refreshToken(authHeader.slice(7));
  return ok(res, result);
}
