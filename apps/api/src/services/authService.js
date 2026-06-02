import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  // TODO: persist new user via Prisma
  return {
    id,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
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
