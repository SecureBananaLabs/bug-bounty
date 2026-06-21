import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

const SUPPORTED_PROVIDERS = ["github", "google", "microsoft"];

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
  const { provider } = req.params;
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return fail(res, `Unsupported OAuth provider: ${provider}`, 400);
  }
  return ok(res, {
    provider: provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  const result = await refreshToken();
  return ok(res, result);
}
