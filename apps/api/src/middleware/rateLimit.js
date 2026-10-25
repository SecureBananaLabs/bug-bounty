import rateLimit from "express-rate-limit";

/**
 * Global API rate limit.
 *
 * The defaults are the values this middleware has always used, so behaviour is
 * unchanged unless the environment says otherwise. They are read from the
 * environment because 200 requests per 15 minutes is roughly 0.22 req/s, which
 * makes the API impossible to benchmark and would throttle any realistic load
 * test long before it reached a bottleneck worth finding.
 */
export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  limit: Number(process.env.RATE_LIMIT_MAX ?? 200),
  standardHeaders: "draft-7",
  legacyHeaders: false
});
