import { signAccessToken } from "../utils/jwt.js";

// Default role for all new registrations — never trust client-supplied role
const DEFAULT_ROLE = "client";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const role = DEFAULT_ROLE;
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
