import { validateRegister, validateLogin } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";

export async function register(req, res) {
  const validation = validateRegister(req.body);
  if (!validation.ok) {
    return fail(res, validation.error, 400);
  }
  const result = await registerUser(validation.data);
  return ok(res, result, 201);
}

export async function login(req, res) {
  const validation = validateLogin(req.body);
  if (!validation.ok) {
    return fail(res, validation.error, 401);
  }
  const result = await loginUser(validation.data);
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
