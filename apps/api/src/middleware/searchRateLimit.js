import rateLimit from "express-rate-limit";

/**
 * Create a search-specific rate limiter.
 * Factory function ensures a fresh limiter instance per app,
 * preventing state leak across test runs.
 * 20 requests per minute per IP.
 */
export function createSearchLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many search requests. Please try again later."
    }
  });
}
