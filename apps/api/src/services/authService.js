import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

function createTokenPair(payload) {
  return {
    token: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
}

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const userId = `usr_${Date.now()}`;

  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    ...createTokenPair({ sub: userId, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    ...createTokenPair({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(refreshTokenValue) {
  try {
    const payload = verifyRefreshToken(refreshTokenValue);
    const role = typeof payload.role === "string" ? payload.role : "client";

    return { token: signAccessToken({ sub: payload.sub, role }) };
  } catch {
    return null;
  }
}
