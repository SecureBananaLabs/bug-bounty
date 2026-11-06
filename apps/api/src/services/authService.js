import crypto from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

function hashPassword(password, salt = "freelanceflow_salt") {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password, storedHash, salt = "freelanceflow_salt") {
  if (!storedHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
}

const userStore = new Map();

// Seed initial test users
const seedUsers = [
  {
    id: "usr_client1",
    email: "client@example.com",
    passwordHash: hashPassword("password123"),
    role: "client"
  },
  {
    id: "usr_disabled",
    email: "disabled_user@example.com",
    passwordHash: hashPassword("password123"),
    role: "client",
    status: "DISABLED"
  }
];

for (const user of seedUsers) {
  userStore.set(user.email.toLowerCase(), user);
}

export async function registerUser(payload) {
  const emailKey = payload.email.toLowerCase();
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const user = {
    id,
    email: payload.email,
    passwordHash: hashPassword(payload.password),
    role: payload.role || "client"
  };
  userStore.set(emailKey, user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  if (payload.status === "DISABLED" || payload.isDisabled === true) {
    const error = new Error("Account is disabled");
    error.status = 403;
    error.code = "ACCOUNT_DISABLED";
    throw error;
  }

  const emailKey = payload.email.toLowerCase();
  const user = userStore.get(emailKey);

  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  if (user.status === "DISABLED" || user.isDisabled === true) {
    const error = new Error("Account is disabled");
    error.status = 403;
    error.code = "ACCOUNT_DISABLED";
    throw error;
  }

  return {
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
