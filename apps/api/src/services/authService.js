import { createHash, randomUUID } from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const usersByEmail = new Map();

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

export async function registerUser(payload) {
  const id = `usr_${randomUUID()}`;
  const user = {
    id,
    email: payload.email,
    passwordHash: hashPassword(payload.password),
    role: payload.role
  };
  usersByEmail.set(user.email, user);

  // TODO: persist new user via Prisma
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const user = usersByEmail.get(payload.email);
  if (!user || user.passwordHash !== hashPassword(payload.password)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
