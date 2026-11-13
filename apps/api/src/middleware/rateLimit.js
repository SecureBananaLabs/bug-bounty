import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

export const requestId = (req, res, next) => {
  const id = req.headers["x-request-id"] ?? require("crypto").randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
};
