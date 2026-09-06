import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

export async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (error) {
    next(error);
  }
}

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res, next) {
  try {
    const { token } = req.body;
    const result = await refreshToken(token);
    return ok(res, result);
  } catch (error) {
    if (error.message === "Refresh token required") {
      return res.status(400).json({ success: false, message: "Refresh token required" });
    }
    next(error);
  }
}
