import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

function handleAuthServiceError(error, res) {
  if (error?.code === "EMAIL_ALREADY_REGISTERED") {
    return fail(res, "Email already registered", 409);
  }

  if (error?.code === "INVALID_CREDENTIALS") {
    return fail(res, "Invalid email or password", 401);
  }

  throw error;
}

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  try {
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    return handleAuthServiceError(error, res);
  }
}

export async function login(req, res) {
  const payload = loginSchema.parse(req.body);
  try {
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (error) {
    return handleAuthServiceError(error, res);
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
