import { createHash } from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const usersByEmail = new Map();

function normalizeEmail(email) {
  return email.toLowerCase();
}

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  const email = normalizeEmail(payload.email);
  const user = {
    id,
    email,
    passwordHash: hashPassword(payload.password),
    role: payload.role
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

  if (!user || user.passwordHash !== hashPassword(payload.password)) {
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
