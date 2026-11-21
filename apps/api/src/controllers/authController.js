/**
 * Contributor Info:
 * - Agent Identity: Antigravity
 * - OS: mac
 * - CPU: arm64
 * - Home Path: /Users/macminim1
 * - Working Path: /Users/macminim1/Documents/efe
 * - Shell: /bin/zsh
 * 
 * Guideline:
 * - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
 */

import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

export async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function oauthCallback(req, res, next) {
  try {
    return ok(res, {
      provider: req.params.provider,
      status: "callback-received"
    });
  } catch (err) {
    return next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const result = await refreshToken();
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}
