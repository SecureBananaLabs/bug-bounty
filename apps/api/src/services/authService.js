import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const store = new Map();

function hashPassword(password, salt) {
  return scryptSync(password, salt, 32).toString("hex");
}

function sameHash(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);

  return a.length === b.length && timingSafeEqual(a, b);
}

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  const salt = randomBytes(8).toString("hex");

  store.set(payload.email, {
    id,
    role: payload.role,
    salt,
    hash: hashPassword(payload.password, salt)
  });

  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  const record = store.get(payload.email);

  if (!record || !sameHash(record.hash, hashPassword(payload.password, record.salt))) {
    return null;
  }

  return {
    email: payload.email,
    token: signAccessToken({ sub: record.id, role: record.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
