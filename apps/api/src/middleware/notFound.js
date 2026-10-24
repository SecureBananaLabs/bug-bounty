import { fail } from "../utils/response.js";

// Express' default 404 body is HTML, which breaks clients that parse the API's
// JSON envelope. Anything reaching this point matched no route.
export function notFound(req, res) {
  return fail(res, "Not found", 404);
}
