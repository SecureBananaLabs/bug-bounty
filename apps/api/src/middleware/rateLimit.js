import rateLimit from "express-rate-limit";

const isBenchmarkMode = process.env.BENCHMARK_MODE === 'true';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isBenchmarkMode ? 0 : 200, // Disable rate limit if BENCHMARK_MODE is true for accurate benchmarking
  standardHeaders: "draft-7",
  legacyHeaders: false
});
