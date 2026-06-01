import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role: "client",
    token: signAccessToken({ sub: id, role: "client" })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(actor = { sub: "usr_existing", role: "client" }) {
  const sub = actor?.sub || "usr_existing";
  const role = actor?.role || "client";
  return { token: signAccessToken({ sub, role }) };
}
