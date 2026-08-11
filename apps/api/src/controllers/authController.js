import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

const ALLOWED_PROVIDERS = ["github", "google", "gitlab"];

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
  if (!ALLOWED_PROVIDERS.includes(provider)) {
    return fail(res, `Unsupported OAuth provider: ${provider}`, 400);
  }
  return ok(res, { provider, status: "callback-received" });
}

export async function refresh(req, res) {
  const { refreshToken: token } = req.body ?? {};
  if (!token || typeof token !== "string") {
    return fail(res, "refreshToken is required", 400);
  }
  const result = await refreshToken(token);
  return ok(res, result);
}
