import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  skip: () => process.env.NODE_ENV === "benchmark",
  standardHeaders: "draft-7",
  legacyHeaders: false
});
