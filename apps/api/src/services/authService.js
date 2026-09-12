import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
    // password intentionally excluded from response
  };
}

export async function loginUser(payload) {
  const id = "usr_existing";
  const role = "client";
  return {
    id,
    email: payload.email,
    role,
    token: signAccessToken({ sub: id, role })
    // password intentionally excluded from response
  };
}

export async function refreshToken(token) {
  if (!token) throw Object.assign(new Error("Refresh token required"), { status: 401 });
  const decoded = verifyAccessToken(token);
  return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
}
