import rateLimit from "express-rate-limit";

const limit = process.env.BENCHMARK ? 100000 : 200;

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
