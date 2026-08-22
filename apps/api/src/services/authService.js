import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role }),
    refreshToken: signRefreshToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const user = { id: "usr_existing", role: "client" };
  return {
    email: payload.email,
    token: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken: signRefreshToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken(refreshTokenValue) {
  const decoded = verifyRefreshToken(refreshTokenValue);
  return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
}
