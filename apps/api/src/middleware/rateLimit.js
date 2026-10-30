import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => {
    const benchmarkToken = process.env.BENCHMARK_TOKEN;
    if (!benchmarkToken) {
      return false;
    }

    const headerToken = req.headers["x-benchmark-token"];
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    return headerToken === benchmarkToken || bearerToken === benchmarkToken;
  }
});
