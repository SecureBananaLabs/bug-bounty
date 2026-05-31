import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(refreshTokenValue) {
  if (!refreshTokenValue) {
    throw Object.assign(new Error("Refresh token is required"), { status: 400 });
  }
  try {
    const decoded = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret");
    return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token"), { status: 401 });
  }
}
