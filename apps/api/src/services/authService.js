import { signAccessToken, generateRefreshToken } from "../utils/jwt.js";
import crypto from "node:crypto";

// In-memory refresh token store (swap for Redis/DB in production)
const refreshTokens = new Map();

/**
 * Register a new user and issue token pair.
 */
export async function registerUser(payload) {
  const userId = `usr_${Date.now()}`;
  const role = payload.role || "client";

  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = generateRefreshToken();

  // Store refresh token
  refreshTokens.set(refreshToken, {
    sub: userId,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return {
    id: userId,
    email: payload.email,
    role,
    token: accessToken,
    refresh_token: refreshToken,
  };
}

/**
 * Login and issue token pair.
 */
export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const userId = "usr_existing";
  const role = "client";

  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = generateRefreshToken();

  refreshTokens.set(refreshToken, {
    sub: userId,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return {
    email: payload.email,
    token: accessToken,
    refresh_token: refreshToken,
  };
}

/**
 * Refresh an access token using a valid refresh token.
 * Requires the client to submit their current refresh token.
 * Rejects missing, expired, or already-consumed tokens.
 */
export async function refreshToken(refreshTokenValue) {
  if (!refreshTokenValue || typeof refreshTokenValue !== "string") {
    throw new ValidationError("Refresh token is required");
  }

  const stored = refreshTokens.get(refreshTokenValue);
  if (!stored) {
    throw new ValidationError("Invalid refresh token");
  }

  if (Date.now() > stored.expiresAt) {
    refreshTokens.delete(refreshTokenValue);
    throw new ValidationError("Refresh token has expired");
  }

  // Rotation: remove old token, issue a new one
  refreshTokens.delete(refreshTokenValue);

  const newRefreshToken = generateRefreshToken();
  refreshTokens.set(newRefreshToken, {
    sub: stored.sub,
    role: stored.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  const accessToken = signAccessToken({ sub: stored.sub, role: stored.role });

  return { token: accessToken, refresh_token: newRefreshToken };
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}
