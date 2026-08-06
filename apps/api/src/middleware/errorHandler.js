import { fail } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  if (err?.type === "entity.parse.failed") {
    return fail(res, "Malformed JSON request body", 400);
  }

  if (err?.type === "entity.too.large") {
    return fail(res, "Request body too large", 413);
  }

  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
