import rateLimit from "express-rate-limit";

const BENCHMARK_MODE = process.env.BENCHMARK === "1";

export const apiLimiter = rateLimit({
  windowMs: BENCHMARK_MODE ? 1 : 15 * 60 * 1000,
  limit: BENCHMARK_MODE ? 1_000_000 : 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
