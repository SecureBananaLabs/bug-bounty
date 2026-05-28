import { signAccessToken } from "../utils/jwt.js";
import { listUsers } from "./userService.js";

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
  const users = await listUsers();
  const user = users.find(u => u.email === payload.email);
  if (!user || user.password !== payload.password) {
    return null;
  }
  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  throw new Error("Refresh token must be provided");
}
