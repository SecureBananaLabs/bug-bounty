import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const REFRESH_TOKEN_TYPE = "refresh";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "15m" });
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, tokenType: REFRESH_TOKEN_TYPE }, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);

  if (payload?.tokenType !== REFRESH_TOKEN_TYPE) {
    throw new Error("Invalid refresh token");
  }

  return payload;
}
