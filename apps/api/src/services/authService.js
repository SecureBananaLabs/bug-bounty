import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Generate a new access token for a given user.
 * @param {string} userId
 * @returns {string} access token
 */
export function generateAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: "15m" });
}

/**
 * Generate a refresh token (long-lived).
 * @param {string} userId
 * @returns {string} refresh token
 */
export function generateRefreshToken(userId) {
  return jwt.sign({ sub: userId, type: "refresh" }, env.jwtSecret, {
    expiresIn: "7d",
  });
}

/**
 * Verify a refresh token and return the decoded payload.
 * Throws an error if token is invalid or expired.
 * @param {string} token
 * @returns {{ sub: string, type: string }} decoded payload
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (decoded.type !== "refresh") {
      throw new Error("invalid token");
    }
    return decoded;
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      throw new Error("invalid token");
    }
    throw err;
  }
}

/**
 * Handle refresh token exchange: validate token, issue new access token.
 * @param {string} refreshTokenValue
 * @returns {{ accessToken: string }}
 */
export function refreshToken(refreshTokenValue) {
  const decoded = verifyRefreshToken(refreshTokenValue);
  const accessToken = generateAccessToken(decoded.sub);
  return { accessToken };
}
