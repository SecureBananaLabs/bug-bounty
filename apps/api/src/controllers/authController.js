import { registerSchema, loginSchema, oauthCallbackParamsSchema } from "../validators/auth.js";
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

export async function oauthCallback(req, res, next) {
  try {
    const validated = oauthCallbackParamsSchema.parse(req.params);
    return ok(res, {
      provider: validated.provider,
      status: "callback-received"
    });
  } catch (err) {
    return next(err);
  }
}

export async function refresh(req, res) {
  const result = await refreshToken();
  return ok(res, result);
}
