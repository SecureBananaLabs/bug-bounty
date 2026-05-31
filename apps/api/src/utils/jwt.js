import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign({ ...payload, tokenType: "access" }, env.jwtSecret, { expiresIn: "15m" });
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.tokenType && payload.tokenType !== "access") {
    throw new Error("Invalid token type");
  }

  return payload;
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, tokenType: "refresh" }, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.tokenType !== "refresh") {
    throw new Error("Invalid token type");
  }

  return payload;
}
