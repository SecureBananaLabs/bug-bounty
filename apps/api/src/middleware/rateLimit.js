import rateLimit from "express-rate-limit";

const defaultConfig = {
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
};

export function createRateLimiter() {
  return rateLimit({ ...defaultConfig });
}

/** @deprecated Use createRateLimiter() for per-instance isolation */
export const apiLimiter = rateLimit(defaultConfig);
