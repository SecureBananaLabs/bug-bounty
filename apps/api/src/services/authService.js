import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  // Ensure password is never returned in response
  const { password, ...safePayload } = payload;
  return {
    id: `usr_${Date.now()}`,
    email: safePayload.email,
    role: safePayload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  // Ensure password is never returned in response
  const { password, ...safePayload } = payload;
  return {
    email: safePayload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken() {
  // Ensure password is never returned in response
  const { password, ...safePayload } = payload;
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
