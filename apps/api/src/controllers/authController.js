import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  try {
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    if (error?.code === "AUTH_EMAIL_EXISTS") {
      return res.status(409).json({
        success: false,
        code: "AUTH_EMAIL_EXISTS",
        message: "Email already registered"
      });
    }
    throw error;
  }
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
  const result = await refreshToken();
  return ok(res, result);
}
