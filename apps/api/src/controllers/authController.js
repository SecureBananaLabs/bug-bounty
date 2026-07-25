import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";
import { ZodError } from "zod";

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(res, error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", "), 400);
    }
    throw error;
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(res, error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", "), 400);
    }
    throw error;
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
