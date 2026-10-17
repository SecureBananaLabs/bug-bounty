import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign({ ...payload, tokenType: "access" }, env.jwtSecret, { expiresIn: "15m" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, tokenType: "refresh" }, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, env.jwtSecret);

  if (
    !decoded ||
    typeof decoded !== "object" ||
    decoded.tokenType !== "refresh" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.role !== "string"
  ) {
    throw new jwt.JsonWebTokenError("Invalid refresh token");
  }

  return decoded;
}
