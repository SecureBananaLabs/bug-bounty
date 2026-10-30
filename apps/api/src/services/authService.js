import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/db.js";

export async function registerUser(payload) {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      role: payload.role.toUpperCase()
    }
  });

  const token = signAccessToken({ sub: user.id, role: user.role });
  return {
    id: user.id,
    email: user.email,
    role: user.role.toLowerCase(),
    token
  };
}

export async function loginUser(payload) {
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const valid = await verifyPassword(payload.password, user.passwordHash);
  if (!valid) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const token = signAccessToken({ sub: user.id, role: user.role });
  return {
    id: user.id,
    email: user.email,
    role: user.role.toLowerCase(),
    token
  };
}

export async function refreshToken(user) {
  return { token: signAccessToken({ sub: user.sub, role: user.role }) };
}
