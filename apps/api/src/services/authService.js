import { signAccessToken } from "../utils/jwt.js";

const STUBBED_CLIENT_ROLE = "CLIENT";

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
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: STUBBED_CLIENT_ROLE })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: STUBBED_CLIENT_ROLE }) };
}
