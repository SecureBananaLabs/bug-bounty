import { signAccessToken } from "../utils/jwt.js";

const ALLOWED_ROLES = ['client', 'freelancer'];

export async function registerUser(payload) {
  // Validate role - prevent admin self-assignment
  const role = payload.role || 'client';
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error('Invalid role. Allowed roles: client, freelancer');
  }

  // TODO: persist new user via Prisma
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