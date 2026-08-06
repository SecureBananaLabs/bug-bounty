import crypto from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const users = [];

const normalizeEmail = (email) => email.toLowerCase();

const hashPassword = (password) =>
  crypto.createHash("sha256").update(password).digest("hex");

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const email = normalizeEmail(payload.email);
  const existingUser = users.find((user) => user.email === email);

  if (existingUser) {
    return null;
  }

  const user = {
    id: `usr_${Date.now()}`,
    email,
    role: payload.role,
    passwordHash: hashPassword(payload.password)
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
  // TODO: verify password hash against stored user record
  const email = normalizeEmail(payload.email);
  const user = users.find((candidate) => candidate.email === email);

  if (!user || user.passwordHash !== hashPassword(payload.password)) {
    return null;
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
