import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

const VALID_ROLES = new Set(["client", "freelancer"]);

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const userId = `usr_${Date.now()}`;
  const role = VALID_ROLES.has(payload.role) ? payload.role : "client";
  return {
    id: userId,
    email: payload.email,
    role,
    token: signAccessToken({ sub: userId, role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(refreshTokenStr) {
  if (!refreshTokenStr) {
    throw Object.assign(new Error("Refresh token is required"), { status: 401 });
  }

  try {
    const decoded = verifyAccessToken(refreshTokenStr);
    return {
      token: signAccessToken({ sub: decoded.sub, role: decoded.role })
    };
  } catch (err) {
    throw Object.assign(new Error("Invalid or expired refresh token"), { status: 401 });
  }
}
