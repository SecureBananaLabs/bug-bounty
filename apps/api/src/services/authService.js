import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  // Prevent admin role self-assignment 鈥?admins must be provisioned manually
  const role = payload.role === "admin" ? "client" : payload.role;
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role,
    token: signAccessToken({ sub: id, role })
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
