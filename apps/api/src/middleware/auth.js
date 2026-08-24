import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

const MAX_AUTH_CREDENTIAL_BYTES = 4096;

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  const credential = authHeader.slice(7);
  if (Buffer.byteLength(credential, "utf8") > MAX_AUTH_CREDENTIAL_BYTES) {
    return fail(res, "Credential too large", 400);
  }

  try {
    req.user = verifyAccessToken(credential);
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
