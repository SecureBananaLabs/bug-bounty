import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

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

const SUPPORTED_OAUTH_PROVIDERS = ["google", "github", "discord"];

export async function oauthCallback(req, res) {
  const { provider } = req.params;
  if (!SUPPORTED_OAUTH_PROVIDERS.includes(provider)) {
    return res.status(400).json({
      success: false,
      message: `Unsupported OAuth provider: ${provider}. Supported providers: ${SUPPORTED_OAUTH_PROVIDERS.join(", ")}`
    });
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
