import { signAccessToken } from "../utils/jwt.js";

// TODO: import and use the actual user creation logic
// Placeholder for database user creation
// const { PrismaClient } = await import('@prisma/client');
// const prisma = new PrismaClient();

export async function registerUser(payload) {
  // Generate user ID once to ensure consistency between response and JWT subject
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
  return {

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
