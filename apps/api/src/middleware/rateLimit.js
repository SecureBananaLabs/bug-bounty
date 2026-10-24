import rateLimit from "express-rate-limit";
import { fail } from "../utils/response.js";

export const RATE_LIMIT_MESSAGE = {
  success: false,
  message: "Too many requests"
};

export function rateLimitHandler(_req, res, _next, options) {
  const statusCode =
    typeof options?.statusCode === "number" && Number.isInteger(options.statusCode)
      ? options.statusCode
      : 429;
  const messageText =
    typeof options?.message === "string" && options.message.trim().length > 0
      ? options.message
      : typeof options?.message === "object" &&
          options.message !== null &&
          typeof options.message.message === "string" &&
          options.message.message.trim().length > 0
        ? options.message.message
        : RATE_LIMIT_MESSAGE.message;
  return fail(res, messageText, statusCode);
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
  handler: rateLimitHandler
});
