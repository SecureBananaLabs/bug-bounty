import rateLimit from "express-rate-limit";
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => res.status(429).json({ error: "Too many requests, please try again later." })
});
