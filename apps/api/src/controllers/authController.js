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
  const authHeader = req.headers.authorization;
  const oldToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.body?.token;
  if (!oldToken) {
    return fail(res, "Token is required for refresh", 400);
  }
  try {
    const result = await refreshToken(oldToken);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 401);
  }
}
