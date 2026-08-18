import bcrypt from "bcrypt";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

const SALT_ROUNDS = 12;

// In-memory store (replace with Prisma when DB is connected)
const users = new Map();

export async function registerUser(payload) {
  const existing = [...users.values()].find((u) => u.email === payload.email);
  if (existing) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS);
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const user = {
    id,
    email: payload.email,
    role: payload.role ?? "client",
    hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.set(id, user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

export async function loginUser(payload) {
  const user = [...users.values()].find((u) => u.email === payload.email);
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const valid = await bcrypt.compare(payload.password, user.hashedPassword);
  if (!valid) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

export async function refreshToken(token) {
  if (!token) {
    throw Object.assign(new Error("Refresh token required"), { status: 400 });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = users.get(decoded.sub);
    if (!user) {
      throw Object.assign(new Error("User not found"), { status: 404 });
    }

    return {
      token: signAccessToken({ sub: user.id, role: user.role }),
    };
  } catch (err) {
    if (err.status) throw err;
    throw Object.assign(new Error("Invalid or expired token"), { status: 401 });
  }
}
