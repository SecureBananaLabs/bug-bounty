import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Pin the algorithm to prevent algorithm confusion attacks (CVE-2015-9235)
const JWT_ALGORITHM = env.jwtAlgorithm || "HS256";

export function signAccessToken(payload) {
  return jwt.sign(
    { ...payload, iat: Math.floor(Date.now() / 1000) },
    env.jwtSecret,
    { algorithm: JWT_ALGORITHM, expiresIn: "15m" }
  );
}

export function verifyAccessToken(token) {
  // Verify signature and enforce algorithm, expiry, and subject presence
  const payload = jwt.verify(token, env.jwtSecret, {
    algorithms: [JWT_ALGORITHM],
    maxAge: "30m", // strict upper bound regardless of exp claim
  });

  if (!payload || !payload.sub) {
    throw new Error("Token missing required sub claim");
  }

  return payload;
}
