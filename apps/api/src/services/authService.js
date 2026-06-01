import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  const userId = `usr_${Date.now()}`;
  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: userId, role: payload.role })
  };
}

export async function loginUser(payload) {
  const userId = `usr_${Date.now()}`;
  return {
    id: userId,
    email: payload.email,
    token: signAccessToken({ sub: userId, role: payload.role })
  };
}

export async function refreshToken(refreshTokenValue, requestUserId) {
  if (!refreshTokenValue) throw new Error("Refresh token required");
  const userId = requestUserId || `usr_${Date.now()}`;
  return { token: signAccessToken({ sub: userId }), refreshToken: refreshTokenValue };
}
