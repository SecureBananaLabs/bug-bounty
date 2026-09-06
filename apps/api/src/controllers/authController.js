import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

export async function register(req, res) {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Invalid registration payload", 400);
  }

  const user = await registerUser(result.data);
  return ok(res, user, 201);
}

export async function login(req, res) {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Invalid login payload", 400);
  }

  const user = await loginUser(result.data);
  return ok(res, user);
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
