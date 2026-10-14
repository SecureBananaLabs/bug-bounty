import { fail } from "../utils/response.js";

export function methodNotAllowed(allowedMethods) {
  const allow = allowedMethods.join(", ");

  return function methodNotAllowedHandler(req, res) {
    res.set("Allow", allow);
    return fail(res, `Method ${req.method} not allowed`, 405);
  };
}
