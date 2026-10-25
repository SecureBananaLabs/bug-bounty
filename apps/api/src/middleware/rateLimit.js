import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test" || process.env.BENCHMARK === "true" ? 9999999 : 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
