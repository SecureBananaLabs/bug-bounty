import { signAccessToken } from "../utils/jwt.js";

const ALLOWED_ROLES = ["client", "freelancer"];

export async function registerUser(payload) {
  const now = Date.now();
  const userId = `usr_${now}`;
  const role = ALLOWED_ROLES.includes(payload.role) ? payload.role : "client";
  return {
    id: userId,
    email: payload.email,
    role: role,
    token: signAccessToken({ sub: userId, role: role })
  };
}

export async function loginUser(payload) {
  if (!payload.email || !payload.password) {
    throw new Error("Email and password are required");
  }
  throw new Error("Login not available: credential verification not yet implemented");
}

export async function refreshToken(payload) {
  if (!payload || !payload.refreshToken) {
    throw new Error("Refresh token is required");
  }
  throw new Error("Token refresh not available: refresh token verification not yet implemented");
}
