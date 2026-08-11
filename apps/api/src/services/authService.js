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
  // TODO: verify password hash against stored user record and load real role
  const id = `usr_existing`;
  const role = payload.role ?? "client";
  return {
    id,
    email: payload.email,
    role,
    token: signAccessToken({ sub: id, role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
