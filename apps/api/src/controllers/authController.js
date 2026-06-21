import { registerSchema, loginSchema, refreshSchema } from "../validators/auth.js";
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
  // Accept token from Authorization: Bearer header or request body
  let token = req.headers?.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || token === "") {
    try {
      const body = refreshSchema.parse(req.body);
      token = body.refreshToken;
    } catch {
      return fail(res, "Refresh token is required", 401);
    }
  }

  const result = await refreshToken(token);
  return ok(res, result);
}
