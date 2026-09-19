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
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(payload) {
  // payload.refreshToken was already validated by refreshSchema.
  // In a real impl we'd verify the refresh JWT against a stored jti
  // or rotation table, then issue a fresh access token.
  if (!payload || typeof payload.refreshToken !== "string" || payload.refreshToken.length === 0) {
    throw new Error("refreshToken is required");
  }
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
