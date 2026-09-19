import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const usersByEmail = new Map();

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashPassword(password, salt) {
  return scryptSync(password, salt, 32).toString("hex");
}

function passwordsMatch(password, user) {
  const storedHash = Buffer.from(user.passwordHash, "hex");
  const candidateHash = Buffer.from(hashPassword(password, user.passwordSalt), "hex");
  return storedHash.length === candidateHash.length && timingSafeEqual(storedHash, candidateHash);
}

function authError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function registerUser(payload) {
  const email = normalizeEmail(payload.email);

  if (usersByEmail.has(email)) {
    throw authError("Email already registered", 409);
  }

  const id = `usr_${randomUUID()}`;
  const user = {
    id,
    email,
    role: payload.role,
    passwordSalt: randomBytes(16).toString("hex")
  };
  user.passwordHash = hashPassword(payload.password, user.passwordSalt);
  usersByEmail.set(email, user);

  return {
    id,
    email,
    role: user.role,
    token: signAccessToken({ sub: id, role: user.role })
  };
}

export async function loginUser(payload) {
  const email = normalizeEmail(payload.email);
  const user = usersByEmail.get(email);

  if (!user || !passwordsMatch(payload.password, user)) {
    throw authError("Invalid email or password", 401);
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}

export function resetAuthUsersForTests() {
  usersByEmail.clear();
}
