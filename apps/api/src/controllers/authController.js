import { registerSchema, loginSchema } from "../validators/auth.js";
import * as authService from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

let authServiceImpl = authService;

export function setAuthServiceForTest(overrides) {
  authServiceImpl = overrides ?? authService;
}

function handleUnexpectedAuthError(res, error) {
  console.error("Unhandled auth controller error:", error);
  return fail(res, "Unexpected server error", 500);
}

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await authServiceImpl.registerUser(payload);
    return ok(res, result, 201);
  } catch (error) {
    return handleUnexpectedAuthError(res, error);
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authServiceImpl.loginUser(payload);
    return ok(res, result);
  } catch (error) {
    return handleUnexpectedAuthError(res, error);
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
    const result = await authServiceImpl.refreshToken();
    return ok(res, result);
  } catch (error) {
    return handleUnexpectedAuthError(res, error);
  }
}
