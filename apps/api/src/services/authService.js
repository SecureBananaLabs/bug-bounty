import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  const now = Date.now();
  const userId = `usr_${now}`;
  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: userId, role: payload.role })
  };
}

export async function loginUser(payload) {
  // Validate that credentials are provided before issuing a token
  if (!payload.email || !payload.password) {
    throw new Error("Email and password are required");
  }
  // TODO: verify password hash against stored user record via Prisma
  // For now, reject login since credential verification is not implemented
  throw new Error("Login not available: credential verification not yet implemented");
}

export async function refreshToken(payload) {
  // TODO: verify the provided refresh token before issuing a new one
  if (!payload || !payload.refreshToken) {
    throw new Error("Refresh token is required");
  }
  throw new Error("Token refresh not available: refresh token verification not yet implemented");
}
