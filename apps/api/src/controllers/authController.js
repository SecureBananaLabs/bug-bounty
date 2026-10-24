import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    if (error.name === "ZodError") {
      const issue = error.issues[0];
      return fail(res, issue ? issue.message : "Validation failed", 400);
    }
    return fail(res, "Registration processing error", 500);
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (error) {
    if (error.name === "ZodError") {
      const issue = error.issues[0];
      return fail(res, issue ? issue.message : "Validation failed", 400);
    }
    return fail(res, "Login processing error", 500);
  }
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
