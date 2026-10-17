import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

const ALLOWED_PROVIDERS = ["github", "google", "linkedin"];

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  return ok(res, await registerUser(payload), 201);
}
export async function login(req, res) {
  const payload = loginSchema.parse(req.body);
  return ok(res, await loginUser(payload));
}
export async function oauthCallback(req, res) {
  const { provider } = req.params;
  if (!ALLOWED_PROVIDERS.includes(provider)) return fail(res, `Unsupported provider: ${provider}`, 400);
  return ok(res, { provider, status: "callback-received" });
}
export async function refresh(req, res) {
  return ok(res, await refreshToken(req.body.token));
}
