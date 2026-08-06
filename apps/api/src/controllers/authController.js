import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

const supportedOAuthProviders = new Set(["github", "google"]);

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
  const { code } = req.query;

  if (!supportedOAuthProviders.has(provider)) {
    return fail(res, "Unsupported OAuth provider");
  }

  if (typeof code !== "string" || code.trim().length === 0) {
    return fail(res, "Missing OAuth code");
  }

  return ok(res, {
    provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  const result = await refreshToken();
  return ok(res, result);
}
