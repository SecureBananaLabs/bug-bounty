import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

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
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Refresh token is required", 400);
  }

  let result;
  try {
    result = await refreshToken(parsed.data.token);
  } catch {
    return fail(res, "Invalid refresh token", 401);
  }

  return ok(res, result);
}
