import rateLimit from "express-rate-limit";

function isLocalBenchmarkRequest(req) {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.BENCHMARK_DISABLE_RATE_LIMIT === "true" &&
    req.get("X-Benchmark-Run") === "true" &&
    ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.ip)
  );
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: isLocalBenchmarkRequest
});
