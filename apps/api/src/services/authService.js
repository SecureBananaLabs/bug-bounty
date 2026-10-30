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
  const id = "usr_existing";
  const role = "client";
  // The login response is the only identity payload a client receives after the
  // password check, so it has to carry the same id and role the token claims.
  return {
    id,
    email: payload.email,
    role,
    token: signAccessToken({ sub: id, role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
