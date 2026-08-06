import rateLimit from "express-rate-limit";

const fifteenMinutes = 15 * 60 * 1000;

export const apiLimiter = rateLimit({
  windowMs: fifteenMinutes,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: fifteenMinutes,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later."
  }
});
