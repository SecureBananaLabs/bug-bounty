import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

export const apiLimiter = (req, res, next) => {
  if (process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true") {
    return next();
  }
  return limiter(req, res, next);
};
