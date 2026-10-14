import crypto from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const usersByEmail = new Map();

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function resetAuthUsersForTest() {
  usersByEmail.clear();
}

export async function registerUser(payload) {
  const email = normalizeEmail(payload.email);
  if (usersByEmail.has(email)) {
    return null;
  }

  const user = {
    id: crypto.randomUUID(),
    email,
    role: payload.role,
    passwordHash: hashPassword(payload.password)
  };

  usersByEmail.set(email, user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const email = normalizeEmail(payload.email);
  const user = usersByEmail.get(email);
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
