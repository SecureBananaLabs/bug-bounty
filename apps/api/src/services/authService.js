import bcrypt from "bcryptjs";
import { signAccessToken } from "../utils/jwt.js";

const SALT_ROUNDS = 12;

// In-memory user store (replace with Prisma/DB in production)
const users = new Map();

export async function registerUser(payload) {
  // Hash the password before storing
  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);

  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role || "client",
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.set(user.email, user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

export async function loginUser(payload) {
  // Look up user by email
  const user = users.get(payload.email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password hash against stored user record
  const isValid = await bcrypt.compare(payload.password, user.passwordHash);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
