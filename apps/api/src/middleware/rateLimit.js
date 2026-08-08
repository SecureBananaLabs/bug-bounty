import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  skip: (req) => {
    const benchmarkToken = process.env.BENCHMARK_BYPASS_TOKEN;
    return Boolean(benchmarkToken) && req.get("x-benchmark-token") === benchmarkToken;
  },
  standardHeaders: "draft-7",
  legacyHeaders: false
});
