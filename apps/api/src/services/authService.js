import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // Strip admin role to prevent self-assignment during registration
  const safeRole = payload.role === "admin" ? "client" : payload.role;

  // TODO: persist new user via Prisma
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: safeRole,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: safeRole })
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
