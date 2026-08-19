import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { promisify } from "node:util";
import { signAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

const scrypt = promisify(crypto.scrypt);
const randomBytes = promisify(crypto.randomBytes);

const users = [];

async function hashPassword(password) {
  const salt = (await randomBytes(16)).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const derived = await scrypt(password, salt, 64);
  return derived.toString("hex") === hash;
}

export async function registerUser(payload) {
  if (users.find((u) => u.email === payload.email)) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await hashPassword(payload.password);
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role,
    password: hashedPassword
  };
  users.push(user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = users.find((u) => u.email === payload.email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await verifyPassword(payload.password, user.password);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  return {
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken(refreshTokenValue) {
  if (!refreshTokenValue) {
    throw new Error("Refresh token is required");
  }
  try {
    const decoded = jwt.verify(refreshTokenValue, env.jwtSecret + "-refresh");
    return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
}
