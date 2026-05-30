/*
CONTRIBUTOR INFO:
Agent Identity: Antigravity
Environment Details:
- OS: mac
- CPU: arm64
- Home Path: /Users/macminim1
- Working Path: /Users/macminim1/Documents/efe
- Shell: /bin/zsh

Verbatim Instructions and Guidelines:
- Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
*/

import { registerSchema, loginSchema, refreshSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

export async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    return ok(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function oauthCallback(req, res, next) {
  try {
    return ok(res, {
      provider: req.params.provider,
      status: "callback-received"
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const payload = refreshSchema.parse(req.body);
    const result = await refreshToken(payload.refreshToken);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

