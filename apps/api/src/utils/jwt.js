import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "15m" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret);
}
