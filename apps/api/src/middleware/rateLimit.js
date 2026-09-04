import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

// Stricter limiter for credential endpoints to slow brute-force / stuffing.
const authWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const authMax = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 10);

export const authLimiter = rateLimit({
  windowMs: Number.isFinite(authWindowMs) && authWindowMs > 0 ? authWindowMs : 15 * 60 * 1000,
  limit: Number.isFinite(authMax) && authMax > 0 ? authMax : 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts, try again later"
  }
});
