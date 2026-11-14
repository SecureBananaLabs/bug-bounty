import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const now = Date.now();
  const userId = `usr_${now}`;
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

export async function refreshToken(user) {
  // Issue a fresh token for the authenticated caller
  const sub = user?.sub ?? "usr_unknown";
  const role = user?.role ?? "client";
  return { token: signAccessToken({ sub, role }) };
}
