import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "benchmark"
    ? Number(process.env.BENCHMARK_RATE_LIMIT ?? 100000)
    : 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
