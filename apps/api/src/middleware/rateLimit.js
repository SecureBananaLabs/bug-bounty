import rateLimit from "express-rate-limit";

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const apiLimiter = rateLimit({
  windowMs: positiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  limit: positiveInteger(process.env.RATE_LIMIT_MAX, 200),
  standardHeaders: "draft-7",
  legacyHeaders: false
});
