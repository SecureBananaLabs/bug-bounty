import rateLimit from "express-rate-limit";
import { fail } from "../utils/response.js";

export function createApiLimiter(options = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) => fail(res, "Too many requests", 429),
    ...options
  });
}

export const apiLimiter = createApiLimiter();
