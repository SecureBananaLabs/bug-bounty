import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  // Never allow admin role through public registration
  const role = payload.role === "admin" ? "client" : payload.role;
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: role })
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
