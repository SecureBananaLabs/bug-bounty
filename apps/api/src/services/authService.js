import { signAccessToken } from "../utils/jwt.js";
import { users } from "./userService.js";

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
  // Verify credentials before issuing token
  const user = users.find(u => u.email === payload.email);
  if (!user) {
    throw new Error("Invalid credentials");
  }
  // TODO: use bcrypt.compare once password hashing is implemented
  if (user.password !== payload.password) {
    throw new Error("Invalid credentials");
  }
  const { password: _, ...safeUser } = user;
  return {
    ...safeUser,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
