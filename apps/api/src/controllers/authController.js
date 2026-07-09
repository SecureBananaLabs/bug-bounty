import { authService } from '../services/authService.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.js';

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const data = refreshSchema.parse(req.body);
    const result = await authService.refreshToken(data.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function oauthCallback(req, res, next) {
  try {
    const result = await authService.oauthCallback(req);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
