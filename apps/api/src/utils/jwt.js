import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

function signToken(payload, expiresIn) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}

export function signAccessToken(payload) {
  return signToken(payload, "15m");
}

export function signRefreshToken(payload) {
  return signToken({ ...payload, tokenUse: "refresh" }, "7d");
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);

  if (
    !payload ||
    typeof payload !== "object" ||
    payload.tokenUse !== "refresh" ||
    typeof payload.sub !== "string"
  ) {
    throw new Error("Invalid refresh token");
  }

  return payload;
}
