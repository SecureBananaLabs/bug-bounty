import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

export function register(req, res, next) {
  const payload = registerSchema.parse(req.body);
  return Promise.resolve(registerUser(payload))
    .then((result) => ok(res, result, 201))
    .catch(next);
}

export function login(req, res, next) {
  const payload = loginSchema.parse(req.body);
  return Promise.resolve(loginUser(payload))
    .then((result) => ok(res, result))
    .catch(next);
}

export function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export function refresh(req, res, next) {
  return Promise.resolve(refreshToken())
    .then((result) => ok(res, result))
    .catch(next);
}
