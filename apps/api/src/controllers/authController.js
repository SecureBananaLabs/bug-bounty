import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok } from "../utils/response.js";

const accessTokenCookie = "accessToken";
const accessTokenCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
  maxAge: 15 * 60 * 1000
};

function sendTokenCookie(res, token) {
  res.cookie(accessTokenCookie, token, accessTokenCookieOptions);
}

function stripToken(result) {
  const { token, ...safeResult } = result;
  return { token, safeResult };
}

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  const result = await registerUser(payload);
  const { token, safeResult } = stripToken(result);
  sendTokenCookie(res, token);
  return ok(res, safeResult, 201);
}

export async function login(req, res) {
  const payload = loginSchema.parse(req.body);
  const result = await loginUser(payload);
  const { token, safeResult } = stripToken(result);
  sendTokenCookie(res, token);
  return ok(res, safeResult);
}

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  const result = await refreshToken();
  sendTokenCookie(res, result.token);
  return ok(res, { refreshed: true });
}

export async function logout(req, res) {
  res.clearCookie(accessTokenCookie, {
    ...accessTokenCookieOptions,
    maxAge: undefined
  });
  return ok(res, { loggedOut: true });
}
