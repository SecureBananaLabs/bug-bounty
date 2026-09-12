import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

function readCookieToken(cookieHeader) {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader.match(/(?:^|;\s*)ff_access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = readCookieToken(req.headers.cookie);
  const token = bearerToken ?? cookieToken;

  if (!token) {
    return fail(res, "Unauthorized", 401);
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return fail(res, "Invalid token", 401);
  }
}
