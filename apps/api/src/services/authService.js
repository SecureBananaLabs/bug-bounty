import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // Generate user ID once to ensure id and token subject are strictly synchronized
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

export async function refreshToken(user) {
  const sub = user?.sub ?? user?.id ?? "usr_existing";
  const role = user?.role ?? "client";
  return { token: signAccessToken({ sub, role }) };
}
