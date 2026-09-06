import { fail } from "../utils/response.js";

const JSON_METHODS = new Set(["POST", "PUT", "PATCH"]);

export function jsonContentType(req, res, next) {
  if (JSON_METHODS.has(req.method)) {
    const ct = (req.headers["content-type"] || "").toLowerCase();
    if (!ct.includes("application/json")) {
      return fail(res, "Content-Type must be application/json", 415);
    }
  }
  return next();
}
