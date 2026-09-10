import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  const userId = `usr_${Date.now()}`;
  return {
    id: userId,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role,
    token: signAccessToken({ sub: userId, role: payload.role }),
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  // TODO: look up actual user role from database
  const role = payload.role || "client";
  return {
    email: payload.email,
    role: role,
    token: signAccessToken({ sub: "usr_existing", role: role }),
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
