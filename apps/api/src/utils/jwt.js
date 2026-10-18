import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "15m" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}
