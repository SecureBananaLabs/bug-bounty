import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function oauthCallback(req, res) {
  try {
    return ok(res, {
      provider: req.params.provider,
      status: "callback-received"
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function refresh(req, res) {
  try {
    const result = await refreshToken();
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
