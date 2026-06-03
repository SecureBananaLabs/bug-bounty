import { signAccessToken } from "../utils/jwt.js";
import crypto from "node:crypto";

// In-memory user store — simulates a real DB
const users = [];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const derived = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === derived;
}

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  const hashedPassword = hashPassword(payload.password);
  users.push({ id, email: payload.email, role: payload.role, password: hashedPassword });
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  const user = users.find((u) => u.email === payload.email);
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  if (!verifyPassword(payload.password, user.password)) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
