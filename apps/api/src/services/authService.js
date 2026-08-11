import { signAccessToken, signRefreshToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const sub = `usr_${Date.now()}`;
  return {
    id: sub,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub, role: payload.role }),
    refreshToken: signRefreshToken({ sub, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const sub = "usr_existing";
  return {
    email: payload.email,
    token: signAccessToken({ sub, role: "client" }),
    refreshToken: signRefreshToken({ sub, role: "client" })
  };
}

export async function refreshToken(sub) {
  return { token: signAccessToken({ sub, role: "client" }) };
}
