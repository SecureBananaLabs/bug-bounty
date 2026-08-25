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
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).json({ error: "Missing OAuth authorization code" });
    }
    // Validate state parameter to prevent CSRF on OAuth callback
    const result = await loginUser({ oauthProvider: req.params.provider, oauthCode: code, oauthState: state });
    return ok(res, result);
  } catch (err) {
    return res.status(401).json({ error: "OAuth authentication failed" });
  }
}

export async function refresh(req, res) {
  const result = await refreshToken();
  return ok(res, result);
}
