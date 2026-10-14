import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(token) {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    const err = new Error("Invalid or expired refresh token");
    err.status = 401;
    throw err;
  }
  return { token: signAccessToken({ sub: payload.sub, role: payload.role }) };
}