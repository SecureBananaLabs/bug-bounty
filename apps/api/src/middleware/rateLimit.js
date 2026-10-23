import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

/**
 * Stricter limiter for credential endpoints. The general API budget of
 * 200 req / 15 min leaves far too many attempts for password guessing, so
 * login, registration and refresh get their own, much smaller allowance.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later"
  }
});
