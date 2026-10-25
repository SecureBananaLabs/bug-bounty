import { registerSchema, loginSchema } from "../validators/auth.js";
const { success, error } = require('../utils/response');
const { registerSchema, loginSchema } = require('../validators/auth');
import { ok } from "../utils/response.js";

export async function register(req, res) {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return error(res, validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })), 400);
    }
    const user = await authService.register(validation.data);
    return success(res, user, 'User registered successfully', 201);
  return ok(res, result, 201);
}

export async function login(req, res) {
  const payload = loginSchema.parse(req.body);
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return error(res, validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })), 400);
    }
    const result = await authService.login(validation.data);
    return success(res, result, 'Login successful');
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
