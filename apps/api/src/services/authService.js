import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

function issueTokenPair(user) {
  const tokenPayload = { sub: user.id, role: user.role };

  return {
    token: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload)
  };
}

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role
  };

  return {
    ...user,
    ...issueTokenPair(user)
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const user = {
    id: "usr_existing",
    email: payload.email,
    role: "client"
  };

  return {
    email: user.email,
    ...issueTokenPair(user)
  };
}

export async function refreshToken(token) {
  const decoded = verifyRefreshToken(token);

  return {
    token: signAccessToken({ sub: decoded.sub, role: decoded.role })
  };
}
