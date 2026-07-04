import { signAccessToken } from "../utils/jwt.js";
import crypto from "crypto";

const users = [];

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function registerUser(payload) {
  const userId = `usr_${Date.now()}`;
  const user = {
    id: userId,
    email: payload.email,
    passwordHash: hashPassword(payload.password ?? ""),
    role: payload.role ?? "client",
    createdAt: new Date().toISOString()
  };
  users.push(user);
  return {
    id: userId,
    email: payload.email,
    role: user.role,
    token: signAccessToken({ sub: userId, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = users.find(u => u.email === payload.email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const hash = hashPassword(payload.password ?? "");
  if (user.passwordHash !== hash) {
    throw new Error("Invalid credentials");
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken(user) {
  return { token: signAccessToken({ sub: user.sub || user.id, role: user.role }) };
}
