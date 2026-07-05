import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

function handleAuthError(error, res) {
  if (Number.isInteger(error?.status)) {
    return fail(res, error.message, error.status);
  }

  throw error;
}

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);

  try {
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    return handleAuthError(error, res);
  }
}

export async function login(req, res) {
  const payload = loginSchema.parse(req.body);

  try {
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (error) {
    return handleAuthError(error, res);
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
