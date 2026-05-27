import bcrypt from "bcryptjs";
import { signAccessToken } from "../utils/jwt.js";

// In-memory user store (replaces Prisma until DB is connected)
const users = [];

export async function registerUser(payload) {
  const existing = users.find((u) => u.email === payload.email);
  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(payload.password, salt);
  const id = `usr_${Date.now()}`;
  const user = { id, email: payload.email, passwordHash, role: payload.role || "client" };
  users.push(user);

  return {
    id,
    email: payload.email,
    role: user.role,
    token: signAccessToken({ sub: id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = users.find((u) => u.email === payload.email);
  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!valid) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  // Requires a valid refresh token — not implemented in MVP
  const err = new Error("Refresh token flow not yet implemented");
  err.statusCode = 501;
  throw err;
}
