import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";
import { ZodError } from "zod";

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, `Validation error: ${err.errors.map((e) => e.message).join(", ")}`, 422);
    }
    return fail(res, err.message, err.status ?? 500);
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, `Validation error: ${err.errors.map((e) => e.message).join(", ")}`, 422);
    }
    return fail(res, err.message, err.status ?? 500);
  }
}

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received",
  });
}

export async function refresh(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.body?.token;
    const result = await refreshToken(token);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, err.status ?? 500);
  }
}
