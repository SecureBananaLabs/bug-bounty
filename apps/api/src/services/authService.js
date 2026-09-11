import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

// Minimal in-memory user registry until the Prisma persistence TODO lands.
// Register seeds this map; login verifies the submitted password against the
// stored hash instead of blindly signing a token for a hard-coded subject.
const users = new Map();

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, storedHash) {
  const [scheme, salt, expected] = String(storedHash ?? "").split("$");
  if (scheme !== "scrypt" || !salt || !expected) {
    return false;
  }
  const actual = scryptSync(password, salt, KEY_LENGTH);
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    actual.length === expectedBuffer.length &&
    timingSafeEqual(actual, expectedBuffer)
  );
}

function invalidCredentials() {
  const err = new Error("Invalid credentials");
  err.status = 401;
  return err;
}

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  users.set(payload.email, {
    id,
    email: payload.email,
    role: payload.role,
    passwordHash: hashPassword(payload.password)
  });
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  const stored = users.get(payload.email);
  if (!stored || !verifyPassword(payload.password, stored.passwordHash)) {
    throw invalidCredentials();
  }
  return {
    email: stored.email,
    token: signAccessToken({ sub: stored.id, role: stored.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
