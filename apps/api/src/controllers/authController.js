import { registerSchema, loginSchema, refreshSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";
import jwt from "jsonwebtoken";

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

export async function refresh(req, res, next) {
  try {
    const payload = refreshSchema.parse(req.body);
    const result = await refreshToken(payload.refreshToken);
    return ok(res, result);
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return fail(res, "Invalid refresh token", 401);
    }
    return next(err);
  }
}
