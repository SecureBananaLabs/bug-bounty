import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "15m" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

/** Sign an opaque refresh token (random bytes, not a JWT) */
export function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}
