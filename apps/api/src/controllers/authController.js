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
  const provider = req.params.provider;
  if (!["google", "github", "linkedin"].includes(provider)) {
    return res.status(400).json({ success: false, message: "Unsupported OAuth provider" });
  }
  return ok(res, { provider, status: "callback-received" });
}

export async function refresh(req, res) {
  const token = req.body?.token ?? req.headers?.["x-refresh-token"];
  const result = await refreshToken(token);
  return ok(res, result);
}
