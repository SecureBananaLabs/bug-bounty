import { scryptSync, timingSafeEqual } from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const usersByEmail = new Map();
const passwordSalt = "freelanceflow-auth-placeholder";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashPassword(password) {
  return scryptSync(password, passwordSalt, 32);
}

function passwordsMatch(storedHash, password) {
  const candidateHash = hashPassword(password);
  return storedHash.length === candidateHash.length && timingSafeEqual(storedHash, candidateHash);
}

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const email = normalizeEmail(payload.email);
  const id = `usr_${Date.now()}`;
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
  // TODO: verify password hash against stored user record
  const user = usersByEmail.get(normalizeEmail(payload.email));
  if (!user || !passwordsMatch(user.passwordHash, payload.password)) {
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
