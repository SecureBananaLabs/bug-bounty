import rateLimit from "express-rate-limit";

const apiLimiterOptions = {
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
};

export function createApiLimiter() {
  return rateLimit(apiLimiterOptions);
}

export const apiLimiter = createApiLimiter();
