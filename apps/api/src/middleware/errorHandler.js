import { fail } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && err.type === "entity.parse.failed") {
    return fail(res, "Malformed JSON request body", 400);
  }

  console.error("Unhandled API error:", err);
  return fail(res, "Unexpected server error", 500);
}
