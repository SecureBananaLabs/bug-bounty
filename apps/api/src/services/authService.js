import { signAccessToken } from "../utils/jwt.js";
import { fail } from "../utils/response.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const userId = `usr_${Date.now()}`;
  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: userId, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  // For now, ensure email is provided and return structured error if not
  if (!payload.email || !payload.password) {
    throw new Error("Email and password are required");
  }
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(token) {
  if (!token) {
    throw new Error("Refresh token is required");
  }
  // TODO: verify refresh token against stored record
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
