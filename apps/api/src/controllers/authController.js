import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  const result = await registerUser(payload);
  return ok(res, result, 201);
}

export async function login(req, res) {
  const payload = loginSchema.parse(req.body);
  const result = await loginUser(payload);
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
import { registerUser } from '../services/authService.js';
import { ok } from '../utils/response.js';
import { registerSchema } from '../schemas/authSchemas.js';

export async function register(req, res) {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await registerUser(validatedData);
    return ok(res, user, 201);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', issues: error.issues });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req, res) {
  return ok(res, { message: 'Login successful' });
}
}
