import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/** Algorithm pinned to HS256. Explicit algorithm prevents confusion attacks
 *  where an attacker changes the alg header (e.g. alg:"none" or RS256)
 *  to bypass signature verification. Always pass algorithms to jwt.verify. */
const ALGORITHM = "HS256";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "15m", algorithm: ALGORITHM });
}

export function verifyAccessToken(token) {
  // algorithms array prevents alg:none and algorithm substitution attacks.
  return jwt.verify(token, env.jwtSecret, { algorithms: [ALGORITHM] });
}

