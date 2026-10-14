import { fail } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.parse.failed") {
    return fail(res, "Malformed JSON request body", 400);
  }

  if (err?.type === "entity.too.large") {
    return fail(res, "JSON request body too large", 413);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
