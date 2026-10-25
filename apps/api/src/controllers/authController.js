import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

export async function handleAuthRequest(next, action) {
  try {
    return await action();
  } catch (error) {
    return next(error);
  }
}

export async function register(req, res, next) {
  return handleAuthRequest(next, async () => {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  });
}

export async function login(req, res, next) {
  return handleAuthRequest(next, async () => {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  });
}

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res, next) {
  return handleAuthRequest(next, async () => {
    const result = await refreshToken();
    return ok(res, result);
  });
}
