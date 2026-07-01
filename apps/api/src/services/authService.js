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
  // 1. Look up user record by email from the list of users
  const users = await listUsers();
  const existingUser = users.find(u => u.email === payload.email);

  // 2. Extract actual stored role, fallback dynamically to payload.role (if provided under mock constraints), or default to "client"
  const role = existingUser?.role || payload?.role || "client";
  
  return {
    email: payload.email,
    token: signAccessToken({ sub: existingUser?.id || "usr_existing", role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
