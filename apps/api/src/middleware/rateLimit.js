import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

export function malformedJsonPreLimiter(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return apiLimiter(req, res, next);
}
