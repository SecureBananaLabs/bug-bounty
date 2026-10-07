import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign({ ...payload, tokenType: "access" }, env.jwtSecret, { expiresIn: "15m" });
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, tokenType: "refresh" }, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyAccessToken(token) {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (decoded.tokenType !== "access") {
    throw new Error("Invalid access token type");
  }
  return decoded;
}

export function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (decoded.tokenType !== "refresh") {
    throw new Error("Invalid refresh token type");
  }
  return decoded;
}
