import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const apiLimiter = env.benchmarkMode
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
      standardHeaders: "draft-7",
      legacyHeaders: false
    });
