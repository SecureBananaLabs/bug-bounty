import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

function issueTokenPair(user) {
  return {
    token: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken: signRefreshToken({ sub: user.id, role: user.role })
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
  const user = { id: "usr_existing", email: payload.email, role: "client" };
  return {
    email: user.email,
    ...issueTokenPair(user)
  };
}

export async function refreshToken(token) {
  const payload = verifyRefreshToken(token);
  return { token: signAccessToken({ sub: payload.sub, role: payload.role }) };
}
