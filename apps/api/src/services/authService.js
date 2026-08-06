import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

function issueTokens(user) {
  return {
    token: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken: signRefreshToken({ sub: user.id, role: user.role })
  };
}

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role: payload.role,
    ...issueTokens({ id, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const user = { id: "usr_existing", role: "client" };
  return {
    email: payload.email,
    ...issueTokens(user)
  };
}

export async function refreshToken(token) {
  const payload = verifyRefreshToken(token);
  return { token: signAccessToken({ sub: payload.sub, role: payload.role }) };
}
