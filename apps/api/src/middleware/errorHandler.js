import { fail } from "../utils/response.js";

function isMalformedJsonError(err) {
  return err instanceof SyntaxError && err.status === 400 && err.type === "entity.parse.failed";
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (isMalformedJsonError(err)) {
    return fail(res, "Malformed JSON body", 400);
  }

  console.error("Unhandled API error:", err);
  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
