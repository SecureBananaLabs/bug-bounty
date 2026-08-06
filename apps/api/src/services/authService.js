import { createHash, timingSafeEqual } from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const usersByEmail = new Map();

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

function passwordsMatch(password, expectedHash) {
  const actualHash = hashPassword(password);
  return timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
}

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const id = `usr_${Date.now()}`;
  const user = {
    id,
    email: payload.email,
    passwordHash: hashPassword(payload.password),
    role: payload.role
  };
  usersByEmail.set(payload.email.toLowerCase(), user);

  return {
    id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: id, role: user.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const user = usersByEmail.get(payload.email.toLowerCase());
  if (!user || !passwordsMatch(payload.password, user.passwordHash)) {
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
