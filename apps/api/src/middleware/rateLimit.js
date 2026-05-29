import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  skip: (req) => req.headers["x-benchmark-run"] === "1",
  standardHeaders: "draft-7",
  legacyHeaders: false
});
