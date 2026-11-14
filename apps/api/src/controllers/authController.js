import { registerSchema, refreshSchema, loginSchema } from "../validators/auth.js";
import { fail } from "../utils/response.js";
import { loginUser, refreshTokenWithCredential, registerUser } from "../services/authService.js";
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
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Missing or invalid refresh token", 400);
  }

  try {
    const payload = await refreshTokenWithCredential(parsed.data.token);
    return ok(res, payload);
  } catch (error) {
    return fail(res, "Invalid refresh token", 401);
  }
}
