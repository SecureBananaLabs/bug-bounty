import { authService } from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const result = await authService.register({ email, password, role });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const user = req.user; // 由 authenticate 中间件填充
    const token = await authService.refreshToken(user.id, user.role);
    res.status(200).json({ accessToken: token });
  } catch (err) {
    next(err);
  }
}

export async function oauthCallback(req, res, next) {
  try {
    const { code } = req.query;
    const result = await authService.handleOAuthCallback(code);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
