import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";
import { fail } from "../utils/response.js";

export async function registerUser(payload) {
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
  const id = "usr_existing";
  return {
    email: payload.email,
    token: signAccessToken({ sub: id, role: "client" })
  };
}

export async function refreshToken(token) {
  try {
    const decoded = verifyAccessToken(token);
    return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
  } catch {
    return fail(null, "Invalid refresh token", 401);
  }
}
