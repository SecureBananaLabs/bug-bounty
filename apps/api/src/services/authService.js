import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // Fix #5204: Generate ID once and reuse for both user.id and JWT sub
  const userId = `usr_${Date.now()}`;
  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: userId, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
