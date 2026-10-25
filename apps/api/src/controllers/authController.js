import { registerSchema, loginSchema, refreshSchema, SUPPORTED_OAUTH_PROVIDERS } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

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
  if (!SUPPORTED_OAUTH_PROVIDERS.includes(provider)) {
    return fail(res, `Unsupported OAuth provider: ${provider}`, 400);
  }
  return ok(res, { provider, status: "callback-received" });
}

export async function refresh(req, res) {
  const { refreshToken: token } = refreshSchema.parse(req.body);
  const result = await refreshToken(token);
  return ok(res, result);
}
