import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (err) {
    if (err.name === "ZodError") {
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
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message, code: err.code });
    }
    if (err.name === "ZodError") {
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
  const result = await refreshToken();
  return ok(res, result);
}
