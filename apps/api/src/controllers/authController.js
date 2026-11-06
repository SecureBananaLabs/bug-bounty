import { registerSchema, loginSchema } from "../validators/auth.js";
import { AuthError, loginUser, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

export async function register(req, res, next) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid request body", 400, parsed.error.issues);
  }

  try {
    return ok(res, await registerUser(parsed.data), 201);
  } catch (error) {
    return handleAuthError(error, res, next);
  }
}

export async function login(req, res, next) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid request body", 400, parsed.error.issues);
  }

  try {
    return ok(res, await loginUser(parsed.data));
  } catch (error) {
    return handleAuthError(error, res, next);
  }
}

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  return fail(res, "Refresh tokens are not configured", 501);
}

function handleAuthError(error, res, next) {
  if (error instanceof AuthError) {
    return fail(res, error.message, error.status);
  }

  return next(error);
}
