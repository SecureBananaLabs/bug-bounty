import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Algorithm is HARDCODED — never configurable via env.
// A configurable algorithm is a full authentication bypass risk (CVE-2015-9235).
const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = env.jwtIssuer || "securebanana-api";
const JWT_AUDIENCE = env.jwtAudience || "securebanana-clients";
const JWT_EXPIRY = "15m";

export function signAccessToken(payload) {
  return jwt.sign(
    { ...payload, iat: Math.floor(Date.now() / 1000) },
    env.jwtSecret,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: JWT_EXPIRY,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
}

export function verifyAccessToken(token) {
  // Verify signature, algorithm, issuer, audience, and expiry.
  // maxAge MUST match expiresIn — mismatched lifetimes weaken security.
  const payload = jwt.verify(token, env.jwtSecret, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    maxAge: JWT_EXPIRY,
  });

  if (!payload || !payload.sub) {
    throw new Error("Token missing required claims");
  }

  return payload;
}
