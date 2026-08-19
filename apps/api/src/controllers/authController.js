import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

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
  try {
    const token = req.body.refreshToken;
    const result = await refreshToken(token);
    return ok(res, result);
  } catch (error) {
    if (error.message === "Refresh token is required" || error.message === "Invalid refresh token") {
      return res.status(401).json({ success: false, error: error.message });
    }
    throw error;
  }
}
