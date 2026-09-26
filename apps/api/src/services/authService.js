import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

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

export async function refreshToken(token) {
  const verified = verifyAccessToken(token);
  if (typeof verified !== "object" || !verified.sub) {
    throw new Error("Invalid token claims");
  }

  const payload = { sub: verified.sub };
  if (typeof verified.role === "string") {
    payload.role = verified.role;
  }

  return { token: signAccessToken(payload) };
}
