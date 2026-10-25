import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

const SUPPORTED_OAUTH_PROVIDERS = ["google", "github"];

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return fail(res, message, 400);
  }
  const result = await registerUser(parsed.data);
  return ok(res, result, 201);
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return fail(res, message, 400);
  }
  const result = await loginUser(parsed.data);
  return ok(res, result);
}

export async function oauthCallback(req, res) {
  const { provider } = req.params;
  if (!SUPPORTED_OAUTH_PROVIDERS.includes(provider)) {
    return fail(res, `Unsupported OAuth provider: ${provider}`, 400);
  }
  return ok(res, {
    provider,
    status: "callback-received",
  });
}

export async function refresh(req, res) {
  const result = await refreshToken();
  return ok(res, result);
}
