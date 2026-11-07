import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
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
  // TODO: look up stored refresh token in database
  const decoded = verifyAccessToken(token);
  return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
}
