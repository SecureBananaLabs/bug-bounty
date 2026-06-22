import { signAccessToken } from "../utils/jwt.js";

const ALLOWED_ROLES = new Set(["client", "freelancer"]);

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  // Enforce safe default role — never trust client-supplied role (prevents privilege escalation)
  const role = ALLOWED_ROLES.has(payload.role) ? payload.role : "client";
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role })
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
