import { registerSchema, loginSchema } from "../validators/auth.js";
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
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return validationFailed(res, parsed.error);
  }

  const result = await registerUser(parsed.data);
  return ok(res, result, 201);
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return validationFailed(res, parsed.error);
  }

  const result = await loginUser(parsed.data);
  return ok(res, result);
}

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  const result = await refreshToken();
  return ok(res, result);
}
