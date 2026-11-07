import { signAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

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

export async function loginAdmin(payload) {
  if (payload.email !== env.adminEmail || payload.password !== env.adminPassword) {
    return null;
  }

  return {
    email: payload.email,
    token: signAccessToken({ sub: "admin-1", role: "ADMIN", email: payload.email })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
