import rateLimit from "express-rate-limit";

const isBenchmark = process.env.BENCHMARK_MODE === "true";

export const apiLimiter = isBenchmark
  ? (req, res, next) => next() // bypass rate limit during benchmarks
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
      standardHeaders: "draft-7",
      legacyHeaders: false
    });
