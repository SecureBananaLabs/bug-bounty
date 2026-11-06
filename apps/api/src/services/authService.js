import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "../config/db.js";
import { signAccessToken } from "../utils/jwt.js";

const scrypt = promisify(scryptCallback);
const keyLength = 64;
const scryptOptions = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const supportedRoles = new Set(["client", "freelancer"]);

export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function createAuthService({ database = prisma, tokenSigner = signAccessToken } = {}) {
  async function registerUser(payload) {
    if (!supportedRoles.has(payload.role)) {
      throw new AuthError("Invalid registration role", 400);
    }

    const email = payload.email.trim().toLowerCase();
    const existing = await database.user.findUnique({
      where: { email },
      select: { id: true }
    });
    if (existing) {
      throw new AuthError("Email is already registered", 409);
    }

    const passwordHash = await hashPassword(payload.password);
    let user;
    try {
      user = await database.user.create({
        data: {
          email,
          passwordHash,
          fullName: payload.fullName.trim(),
          role: payload.role.toUpperCase()
        },
        select: { id: true, email: true, role: true }
      });
    } catch (error) {
      if (error?.code === "P2002") {
        throw new AuthError("Email is already registered", 409);
      }
      throw error;
    }

    return issueAccessToken(user, tokenSigner);
  }

  async function loginUser(payload) {
    const email = payload.email.trim().toLowerCase();
    const user = await database.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, role: true }
    });

    if (!user) {
      await scrypt(payload.password, Buffer.alloc(16), keyLength, scryptOptions);
      throw new AuthError("Invalid email or password", 401);
    }

    if (!(await verifyPassword(payload.password, user.passwordHash))) {
      throw new AuthError("Invalid email or password", 401);
    }

    return issueAccessToken(user, tokenSigner);
  }

  return { registerUser, loginUser };
}

const authService = createAuthService();

export const registerUser = authService.registerUser;
export const loginUser = authService.loginUser;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, keyLength, scryptOptions);
  return `scrypt$16384$8$1$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password, passwordHash) {
  const parts = passwordHash?.split("$");
  if (
    parts?.length !== 6 ||
    parts[0] !== "scrypt" ||
    parts[1] !== "16384" ||
    parts[2] !== "8" ||
    parts[3] !== "1" ||
    !/^[a-f0-9]{32}$/.test(parts[4]) ||
    !/^[a-f0-9]{128}$/.test(parts[5])
  ) {
    return false;
  }

  const salt = Buffer.from(parts[4], "hex");
  const expected = Buffer.from(parts[5], "hex");
  const actual = await scrypt(password, salt, expected.length, scryptOptions);
  return timingSafeEqual(actual, expected);
}

function issueAccessToken(user, tokenSigner) {
  const role = user.role.toLowerCase();
  return {
    id: user.id,
    email: user.email,
    role,
    token: tokenSigner({ sub: user.id, role })
  };
}
