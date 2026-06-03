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
  // Security: Require both refresh token and user ID
  if (!refreshTokenValue) {
    throw new Error("Refresh token required");
  }
  if (!requestUserId) {
    throw new Error("User ID required for token refresh");
  }
  
  // In production: validate refreshTokenValue against database
  // and verify it belongs to requestUserId
  
  return { 
    token: signAccessToken({ sub: requestUserId }),
    refreshToken: refreshTokenValue 
  };
}
