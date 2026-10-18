import { registerSchema, loginSchema, refreshSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.errors?.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ") || err.message, 400);
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.errors?.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ") || err.message, 400);
  }
}

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  try {
    const { token } = refreshSchema.parse(req.body);
    const result = await refreshToken(token);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.errors?.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ") || err.message, 400);
  }
}
