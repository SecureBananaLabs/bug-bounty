import { registerSchema, loginSchema, refreshTokenSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

function validationFailed(res, error) {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    issues: error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message
    }))
  });
}

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
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  const parsed = refreshTokenSchema.safeParse(req.body);

  if (!parsed.success) {
    return validationFailed(res, parsed.error);
  }

  try {
    const result = await refreshToken(parsed.data.refreshToken);
    return ok(res, result);
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token"
    });
  }
}
