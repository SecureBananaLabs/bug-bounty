import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const userId = `usr_${Date.now()}`;
  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: userId, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(token) {
  try {
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.sub) {
      throw new Error("Invalid token payload");
    }
    return { token: signAccessToken({ sub: decoded.sub, role: decoded.role || "client" }) };
  } catch (e) {
    throw new Error("Invalid or expired refresh token");
  }
}
