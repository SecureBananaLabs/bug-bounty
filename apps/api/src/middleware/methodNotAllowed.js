import { fail } from "../utils/response.js";

export function methodNotAllowed(allowedMethods) {
  const allowHeader = allowedMethods.join(", ");

  return (req, res) => {
    res.set("Allow", allowHeader);
    return fail(res, "Method not allowed", 405);
  };
}
