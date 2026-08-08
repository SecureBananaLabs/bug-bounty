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
  const sub = user?.sub ?? user?.id;
  const role = user?.role ?? "client";
  if (!sub) {
    throw new Error("Authenticated user subject is required");
  }
  return { token: signAccessToken({ sub, role }) };
}
