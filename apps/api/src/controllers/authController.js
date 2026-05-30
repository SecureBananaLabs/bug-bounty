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
  const token = req.body?.refreshToken || req.headers?.['x-refresh-token'] || (req.headers?.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized", message: "Refresh token is required" });
  }
  try {
    const result = await refreshToken(token);
    return ok(res, result);
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized", message: err.message || "Invalid refresh token" });
  }
}
