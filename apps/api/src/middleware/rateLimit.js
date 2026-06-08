import rateLimit from "express-rate-limit";

const disabled = process.env.RATE_LIMIT_DISABLED === "true";
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const limit = Number(process.env.RATE_LIMIT_MAX || 200);

export const apiLimiter = disabled
  ? (req, res, next) => next()
  : rateLimit({
      windowMs,
      limit,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    });
