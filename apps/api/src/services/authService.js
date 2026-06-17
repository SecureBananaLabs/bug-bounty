import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const userId = `usr_${Date.now()}`;
  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: userId, role: payload.role }),
    refreshToken: signRefreshToken({ sub: userId, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const userId = "usr_existing";
  return {
    email: payload.email,
    token: signAccessToken({ sub: userId, role: "client" }),
    refreshToken: signRefreshToken({ sub: userId, role: "client" })
  };
}

export async function refreshToken(refreshTokenValue) {
  if (!refreshTokenValue) {
    throw new Error("Refresh token is required");
  }

  try {
    const decoded = verifyRefreshToken(refreshTokenValue);
    return {
      token: signAccessToken({ sub: decoded.sub, role: decoded.role }),
      refreshToken: signRefreshToken({ sub: decoded.sub, role: decoded.role })
    };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}
