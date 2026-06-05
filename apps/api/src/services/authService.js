import { signAccessToken } from "../utils/jwt.js";
import { fail } from "../utils/response.js";

const users = [];

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role
  };
  users.push(user);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = users.find((u) => u.email === payload.email);
  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }
  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken(token) {
  const { verifyAccessToken } = await import("../utils/jwt.js");
  const claims = verifyAccessToken(token);
  return { token: signAccessToken({ sub: claims.sub, role: claims.role }) };
}
