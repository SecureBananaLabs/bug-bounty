import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

export async function register(req, res) {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    return fail(res, "Invalid register payload");
  }

  const payload = validation.data;
  const data = await registerUser(payload);
  return ok(res, data, 201);
}

export async function login(req, res) {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return fail(res, "Invalid login payload");
  }

  const payload = validation.data;
  const data = await loginUser(payload);
  return ok(res, data);
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
