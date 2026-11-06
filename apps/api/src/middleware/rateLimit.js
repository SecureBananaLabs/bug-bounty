import rateLimit from "express-rate-limit";

if (
  process.env.NODE_ENV === "production" &&
  process.env.RATE_LIMIT_ALLOW_MEMORY_STORE !== "true"
) {
  throw new Error(
    "RATE_LIMIT_ALLOW_MEMORY_STORE=true is required to use the process-local " +
      "express-rate-limit MemoryStore in production. Configure a shared store " +
      "for multi-instance deployments instead."
  );
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
