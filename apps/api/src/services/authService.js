import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma; check for duplicate email
  const id = `usr_${Date.now()}`;
  const { password: _pw, ...safePayload } = payload;
  return {
    id,
    email: safePayload.email,
    fullName: safePayload.fullName,
    role: safePayload.role,
    token: signAccessToken({ sub: id, role: safePayload.role }),
    refreshToken: signRefreshToken({ sub: id, role: safePayload.role })
  };
}

export async function loginUser(payload) {
  // TODO: look up user, verify bcrypt password hash, require isVerified === true
  const id = "usr_existing";
  return {
    id,
    email: payload.email,
    role: "client",
    token: signAccessToken({ sub: id, role: "client" }),
    refreshToken: signRefreshToken({ sub: id, role: "client" })
  };
}

export async function refreshToken(token) {
  const decoded = verifyRefreshToken(token);
  return {
    token: signAccessToken({ sub: decoded.sub, role: decoded.role }),
    refreshToken: signRefreshToken({ sub: decoded.sub, role: decoded.role })
  };
}
