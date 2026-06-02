import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  // For the mock implementation, accept a role field in the login payload
  const role = payload.role && ["client", "freelancer", "admin"].includes(payload.role)
    ? payload.role
    : "client";
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
