import rateLimit from "express-rate-limit";

const windowMs = 15 * 60 * 1000;
const limit = Number(process.env.RATE_LIMIT_MAX) || 200;

export const apiLimiter = rateLimit({
  windowMs,
  limit,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
