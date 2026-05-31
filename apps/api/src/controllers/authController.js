import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (err) {
    // Zod validation errors → 400 (#1469)
    if (err.name === "ZodError") {
      return fail(res, err.errors.map(e => e.message).join("; "), 400);
    }
    return fail(res, err.message, 400);
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (err) {
    if (err.name === "ZodError") {
      return fail(res, err.errors.map(e => e.message).join("; "), 400);
    }
    // Generic error message to prevent credential enumeration (#1471)
    return fail(res, "Invalid email or password", 401);
  }
}

// Supported OAuth providers — reject unknown names to prevent route confusion
const SUPPORTED_OAUTH_PROVIDERS = new Set(["google", "github", "facebook"]);

export async function oauthCallback(req, res) {
  const { provider } = req.params;

  if (!SUPPORTED_OAUTH_PROVIDERS.has(provider)) {
    return fail(res, `Unsupported OAuth provider: "${provider}". Supported providers: ${[...SUPPORTED_OAUTH_PROVIDERS].join(", ")}`, 400);
  }

  return ok(res, {
    provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  try {
    // Fix #1471: Extract refresh token from request body or Authorization header
    const refreshTokenString =
      req.body?.refresh_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!refreshTokenString) {
      return fail(res, "Refresh token is required. Provide it as refresh_token in request body or Bearer token in Authorization header.", 400);
    }

    const result = await refreshToken(refreshTokenString);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 401);
  }
}
