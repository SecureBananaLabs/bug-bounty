import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const allowedRoles = ['client', 'freelancer'];
  const role = allowedRoles.includes(payload.role) ? payload.role : 'client';
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role,
    token: signAccessToken({ sub: id, role }),
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" }),
  };
}

export async function refreshToken(user) {
  if (!user || !user.sub) {
    throw new Error("Authenticated user payload is required for token refresh");
  }
  return {
    token: signAccessToken({ sub: user.sub, role: user.role || "client" }),
  };
}
