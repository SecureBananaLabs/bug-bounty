import { fail } from "../utils/response.js";

function isBodyParserError(err, type) {
  return Boolean(err && typeof err === "object" && err.type === type);
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (isBodyParserError(err, "entity.parse.failed")) {
    return fail(res, "Invalid JSON body", 400);
  }

  if (isBodyParserError(err, "entity.too.large")) {
    return fail(res, "Request body too large", 413);
  }

  console.error("Unhandled API error:", err);
  return fail(res, "Unexpected server error", 500);
}
