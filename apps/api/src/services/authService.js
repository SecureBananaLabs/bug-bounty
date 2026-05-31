import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const usersByEmail = new Map();

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function registerUser(payload) {
  const email = normalizeEmail(payload.email);
  const id = `usr_${randomUUID()}`;
  const user = {
    id,
    email,
    role: payload.role,
    passwordHash: hashPassword(payload.password)
  };
  usersByEmail.set(email, user);

  return {
    id,
    email,
    role: user.role,
    token: signAccessToken({ sub: id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = usersByEmail.get(normalizeEmail(payload.email));
  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
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
