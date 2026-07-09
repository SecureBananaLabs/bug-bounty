import { signAccessToken } from "../utils/jwt.js";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

const usersByEmail = new Map();

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function createServiceError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 32);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const email = normalizeEmail(payload.email);
  if (usersByEmail.has(email)) {
    throw createServiceError("EMAIL_ALREADY_REGISTERED", "Email already registered");
  }

  const user = {
    id: `usr_${randomUUID()}`,
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
  // TODO: replace in-memory lookup with Prisma-backed user records.
  const email = normalizeEmail(payload.email);
  const user = usersByEmail.get(email);
  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
    throw createServiceError("INVALID_CREDENTIALS", "Invalid email or password");
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
