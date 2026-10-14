import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const userId = `usr_${Date.now()}`;
  const claims = { sub: userId, role: payload.role };
  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    token: signAccessToken(claims),
    refreshToken: signRefreshToken(claims)
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const claims = { sub: "usr_existing", role: "client" };
  return {
    email: payload.email,
    token: signAccessToken(claims),
    refreshToken: signRefreshToken(claims)
  };
}

export async function refreshToken(refreshTokenValue) {
  const claims = verifyRefreshToken(refreshTokenValue);
  return { token: signAccessToken({ sub: claims.sub, role: claims.role }) };
}
