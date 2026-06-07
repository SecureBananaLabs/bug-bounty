import { fail } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  console.error("Unhandled API error:", err);
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return fail(res, "Malformed JSON request body", 400);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
