import { signAccessToken } from "../utils/jwt.js";
import bcrypt from "bcryptjs";

const USERS = new Map();

export async function registerUser(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 12);
  const id = `usr_${Date.now()}`;
  const user = { id, email: payload.email, role: payload.role, passwordHash };
  USERS.set(payload.email, user);
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  const user = USERS.get(payload.email);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const valid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }
  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken(sub, role) {
  return { token: signAccessToken({ sub, role }) };
}