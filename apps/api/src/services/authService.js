import crypto from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const usersByEmail = new Map();

function createAuthError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeRole(role) {
  return role ?? "client";
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "hex");

  return storedBuffer.length === derivedKey.length && crypto.timingSafeEqual(storedBuffer, derivedKey);
}

function buildAuthResponse(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function registerUser(payload) {
  if (usersByEmail.has(payload.email)) {
    throw createAuthError("Email is already registered", 409);
  }

  const user = {
    id: `usr_${crypto.randomUUID().replaceAll("-", "")}`,
    email: payload.email,
    passwordHash: hashPassword(payload.password),
    role: normalizeRole(payload.role)
  };

  usersByEmail.set(user.email, user);

  return buildAuthResponse(user);
}

export async function loginUser(payload) {
  const user = usersByEmail.get(payload.email);

  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
    throw createAuthError("Invalid email or password", 401);
  }

  return buildAuthResponse(user);
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
