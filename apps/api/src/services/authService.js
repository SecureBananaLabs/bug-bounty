import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

function issueTokens(userId, role) {
  return {
    token: signAccessToken({ sub: userId, role }),
    refreshToken: signRefreshToken({ sub: userId, role })
  };
}

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const userId = `usr_${Date.now()}`;

  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    ...issueTokens(userId, payload.role)
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    ...issueTokens("usr_existing", "client")
  };
}

export async function refreshAccessToken(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  return { token: signAccessToken({ sub: payload.sub, role: payload.role }) };
}
