import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";

/** Supported OAuth providers. Any callback for a provider not in this set
 *  is rejected immediately to prevent probing of unsupported providers. */
const SUPPORTED_OAUTH_PROVIDERS = new Set(["github", "google"]);

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
  // Reject unsupported providers before processing the callback.
  // Without this check, any :provider value is accepted and returns 200,
  // leaking that the OAuth callback route exists and potentially creating
  // an open redirect / unintended processing path for future providers.
  const provider = req.params.provider;
  if (!SUPPORTED_OAUTH_PROVIDERS.has(provider)) {
    return fail(res, `OAuth provider '${provider}' is not supported.`, 400);
  }
  return ok(res, { provider, status: "callback-received" });
}

export async function refresh(req, res) {
  // Pass req.user (populated by authMiddleware on the route) so refreshToken
  // preserves the caller's actual sub and role — previously called with no args
  // causing refreshToken to hardcode sub and role, re-introducing the same
  // role:client bug as loginUser.
  const result = await refreshToken(req.user);
  return ok(res, result);
}
