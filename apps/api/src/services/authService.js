import bcrypt from "bcryptjs";
import { signAccessToken } from "../utils/jwt.js";

// In-memory user registry until Prisma persistence is wired (see packages/db).
const users = new Map();

const BCRYPT_ROUNDS = 10;

function invalidCredentials() {
  const err = new Error("Invalid credentials");
  err.status = 401;
  return err;
}

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  const passwordHash = await bcrypt.hash(payload.password, BCRYPT_ROUNDS);

  users.set(payload.email, {
    id,
    email: payload.email,
    role: payload.role,
    passwordHash
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
  if (!stored) {
    throw invalidCredentials();
  }

  const passwordMatches = await bcrypt.compare(payload.password, stored.passwordHash);
  if (!passwordMatches) {
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
