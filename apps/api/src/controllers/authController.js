import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";
import { ZodError } from "zod";

export async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, err.errors.map(e => e.message).join(", ") || "Invalid payload", 400);
    }
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, err.errors.map(e => e.message).join(", ") || "Invalid payload", 400);
    }
    return next(err);
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
