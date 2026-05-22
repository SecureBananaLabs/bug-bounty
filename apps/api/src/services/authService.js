import { signAccessToken } from "../utils/jwt.js";

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
  const role = payload.email === 'admin@freelanceflow.com' ? 'admin' : 'client';
  const sub = role === 'admin' ? 'usr_admin' : 'usr_existing';
  return {
    email: payload.email,
    token: signAccessToken({ sub, role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
