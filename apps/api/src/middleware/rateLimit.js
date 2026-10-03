import rateLimit from "express-rate-limit";

export const apiLimiter = process.env.BENCHMARK_DISABLE_RATE_LIMIT === "1"
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
      standardHeaders: "draft-7",
      legacyHeaders: false
    });
