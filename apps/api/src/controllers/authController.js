import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

const ALLOWED_PROVIDERS = ["github", "google", "linkedin"];

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
  if (!ALLOWED_PROVIDERS.includes(provider)) {
    return fail(res, `Unsupported OAuth provider: ${provider}`, 400);
  }
  return ok(res, { provider, status: "callback-received" });
}

export async function refresh(req, res) {
  const { token } = req.body;
  const result = await refreshToken(token);
  return ok(res, result);
}
