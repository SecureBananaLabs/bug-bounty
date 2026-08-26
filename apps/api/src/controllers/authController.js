import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

export async function register(req, res) {
  let payload;
  try {
    payload = registerSchema.parse(req.body);
  } catch (error) {
    return fail(res, error.issues?.[0]?.message ?? "Invalid request body", 400);
  }
  const result = await registerUser(payload);
  return ok(res, result, 201);
}

export async function login(req, res) {
  let payload;
  try {
    payload = loginSchema.parse(req.body);
  } catch (error) {
    return fail(res, error.issues?.[0]?.message ?? "Invalid request body", 400);
  }
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
  const result = await refreshToken();
  return ok(res, result);
}
