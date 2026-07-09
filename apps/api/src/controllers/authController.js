import { registerSchema, loginSchema } from "../validators/auth.js";
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

const SUPPORTED_PROVIDERS = ["google", "github"];

export async function oauthCallback(req, res) {
  if (!SUPPORTED_PROVIDERS.includes(req.params.provider)) {
    return fail(res, `Unsupported OAuth provider: ${req.params.provider}`, 400);
  }
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  const { refreshToken: token } = req.body ?? {};
  if (!token || typeof token !== "string") {
    return fail(res, "refreshToken is required", 400);
  }
  const result = await refreshToken(token);
  return ok(res, result);
}
