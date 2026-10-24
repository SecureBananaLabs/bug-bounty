import rateLimit from "express-rate-limit";

export function createApiLimiter() {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
  const limit = Number(process.env.RATE_LIMIT_MAX ?? 200);

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false
  });
}
