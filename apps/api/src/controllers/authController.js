import { registerSchema, loginSchema, refreshSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";
import { ZodError } from "zod";

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ success: false, message: "Validation error", errors: err.errors });
    }
    throw err;
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ success: false, message: "Validation error", errors: err.errors });
    }
    throw err;
  }
}

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  try {
    const { token } = refreshSchema.parse(req.body);
    const result = await refreshToken(token);
    return ok(res, result);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ success: false, message: "Validation error", errors: err.errors });
    }
    if (err.message === "Invalid or expired refresh token") {
      return res.status(401).json({ success: false, message: err.message });
    }
    if (err.message === "Invalid token: missing subject") {
      return res.status(401).json({ success: false, message: err.message });
    }
    throw err;
  }
}
