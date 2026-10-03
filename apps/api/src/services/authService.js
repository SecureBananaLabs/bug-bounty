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
  if (!user?.sub || typeof user.sub !== "string") {
    throw new Error("Cannot refresh a token without an authenticated subject");
  }

  const payload = { sub: user.sub };
  if (typeof user.role === "string") payload.role = user.role;

  return { token: signAccessToken(payload) };
}
