import rateLimit from "express-rate-limit";

export const apiLimiter = process.env.NODE_ENV === "benchmark"
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
      standardHeaders: "draft-7",
      legacyHeaders: false
    });
