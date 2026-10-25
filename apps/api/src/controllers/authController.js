import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser, validateOAuthState } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

function handleAuthError(res, error) {
  if (error.message === "User already exists") {
    return fail(res, error.message, 409);
  }

  if (
    error.message === "Invalid email or password" ||
    error.message === "Invalid OAuth state" ||
    error.message === "User not found" ||
    error.message === "Invalid token type" ||
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    return fail(res, error.message === "User not found" ? "Invalid refresh token" : error.message, 401);
  }

  throw error;
}

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    return handleAuthError(res, error);
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (error) {
    return handleAuthError(res, error);
  }
}

export async function oauthCallback(req, res) {
  try {
    const { state = "" } = req.query;
    await validateOAuthState(req.params.provider, state);
    return ok(res, {
      provider: req.params.provider,
      status: "callback-received"
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

export async function refresh(req, res) {
  try {
    const payload = refreshSchema.parse(req.body);
    const result = await refreshToken(payload.refreshToken);
    return ok(res, result);
  } catch (error) {
    return handleAuthError(res, error);
  }
}
