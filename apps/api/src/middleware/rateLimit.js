import rateLimit from "express-rate-limit";

// Determine the rate limit based on environment variable.
// If BENCHMARK_MODE is 'true', set a very high limit to avoid throttling benchmarks.
// Otherwise, use the default production limit.
const defaultProductionLimit = 200;
const benchmarkTestLimit = 100000; // A very high limit for benchmark runs

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.BENCHMARK_MODE === 'true' ? benchmarkTestLimit : defaultProductionLimit,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
