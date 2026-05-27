import crypto from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  return {
    id: `usr_${crypto.randomUUID().slice(0, 8)}`,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${crypto.randomUUID().slice(0, 8)}`, role: payload.role })
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
