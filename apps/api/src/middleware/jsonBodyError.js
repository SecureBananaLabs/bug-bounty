import { fail } from "../utils/response.js";

export function jsonBodyErrorHandler(err, req, res, next) {
  if (err && err.type === "entity.parse.failed") {
    return fail(res, "Invalid JSON body", 400);
  }
  return next(err);
}
