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

export async function refreshToken(user) {
  // The refresh route is protected by authMiddleware, so `user` is the
  // verified payload of the caller's bearer token. Sign the refreshed
  // access token for that authenticated subject and role instead of a
  // hard-coded identity.
  return { token: signAccessToken({ sub: user.sub, role: user.role }) };
}
