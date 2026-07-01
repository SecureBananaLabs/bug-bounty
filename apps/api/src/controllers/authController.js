import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Invalid request", 400);
  }

  const payload = parsed.data;
  try {
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    if (error?.name === "ConflictError") {
      return fail(res, error.message || "Conflict", 409);
    }
    throw error;
  }
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Invalid request", 400);
  }

  const payload = parsed.data;
  const result = await loginUser(payload);
  return ok(res, result);
}

export async function oauthCallback(req, res) {
  const provider = String(req.params.provider || "").toLowerCase();
  const allowed = new Set(["github", "google"]);
  if (!allowed.has(provider)) {
    return fail(res, "Unsupported OAuth provider", 400);
  }

  const code = req.query.code;
  if (typeof code !== "string" || code.length < 8 || code.length > 128) {
    return fail(res, "Missing or invalid OAuth code", 400);
  }

  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  const result = await refreshToken(req.user);
  return ok(res, result);
}
