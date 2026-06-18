import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

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
  const { refreshToken: token } = req.body;
  if (!token) {
    return res.status(401).json({ error: "Refresh token required" });
  }
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
  if (decoded.type !== "refresh") {
    return res.status(401).json({ error: "Invalid token type" });
  }
  const result = await refreshToken(decoded.sub);
  return ok(res, result);
}
