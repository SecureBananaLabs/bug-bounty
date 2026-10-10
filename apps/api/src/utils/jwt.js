import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    audience: "freelanceflow-api",
    expiresIn: "15m",
    issuer: "freelanceflow-api"
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
    audience: "freelanceflow-api",
    issuer: "freelanceflow-api"
  });
}

export function assertJwtSecret() {
  getJwtSecret();
}

function getJwtSecret() {
  const secret = env.jwtSecret;
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes");
  }

  return secret;
}
