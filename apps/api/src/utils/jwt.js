import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ACCESS_TOKEN_ALGORITHM = "HS256";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: ACCESS_TOKEN_ALGORITHM,
    expiresIn: "15m"
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: [ACCESS_TOKEN_ALGORITHM]
  });
}
