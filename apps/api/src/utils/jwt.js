import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "15m" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, type: "refresh" }, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return decoded;
}
