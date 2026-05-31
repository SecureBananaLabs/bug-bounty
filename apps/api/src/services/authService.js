import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  const userId = `usr_${Date.now()}`;
  const tokenPayload = { sub: userId, role: payload.role };

  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    token: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload)
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const tokenPayload = { sub: "usr_existing", role: "client" };

  return {
    email: payload.email,
    token: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload)
  };
}

export async function refreshToken(refreshTokenValue) {
  const payload = verifyRefreshToken(refreshTokenValue);
  return { token: signAccessToken({ sub: payload.sub, role: payload.role }) };
}
