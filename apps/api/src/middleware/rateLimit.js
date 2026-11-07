import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  skip: () => env.nodeEnv === "benchmark",
  standardHeaders: "draft-7",
  legacyHeaders: false
});
