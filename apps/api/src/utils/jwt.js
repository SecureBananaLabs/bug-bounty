import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "15m" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, tokenType: "refresh" }, env.jwtSecret, {
    expiresIn: "7d"
  });
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (
    !payload ||
    typeof payload !== "object" ||
    payload.tokenType !== "refresh" ||
    typeof payload.sub !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid refresh token");
  }

  return payload;
}
