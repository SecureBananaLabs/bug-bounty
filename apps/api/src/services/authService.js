import { PrismaClient } from "@prisma/client";
import { signAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "./passwordService.js";

const prisma = new PrismaClient();

export class AuthenticationError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "AuthenticationError";
    this.statusCode = 401;
  }
}

function normalizeEmail(email) {
  if (typeof email !== "string") {
    return null;
  }

  const normalized = email.trim().toLowerCase();

  return normalized.length > 0 ? normalized : null;
}

function invalidCredentials() {
  return new AuthenticationError();
}

export async function registerUser(payload) {
  const email = normalizeEmail(payload?.email);

  if (!email || typeof payload?.password !== "string" || !payload.password) {
    throw new TypeError("email and password are required");
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: payload.role
    },
    select: {
      id: true,
      email: true,
      role: true
    }
  });

  return {
    ...user,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const email = normalizeEmail(payload?.email);
  const password = payload?.password;

  if (!email || typeof password !== "string" || password.length === 0) {
    throw invalidCredentials();
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true
    }
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw invalidCredentials();
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
