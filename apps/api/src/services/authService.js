import { signAccessToken } from "../utils/jwt.js";

const ALLOWED_REGISTRATION_ROLES = ["client", "freelancer"];

export async function registerUser(payload) {
  // Security: never allow admin role via registration; force to "client" if invalid
  const safeRole = ALLOWED_REGISTRATION_ROLES.includes(payload.role) ? payload.role : "client";
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role: safeRole,
    token: signAccessToken({ sub: id, role: safeRole })
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
