import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";

function cookieValue(cookieHeader, name) {
  if (!cookieHeader) {
    return "";
  }

  const prefix = `${name}=`;
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookie) {
    return "";
  }

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return cookie.slice(prefix.length);
  }
}

function accessTokenFrom(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return cookieValue(req.headers.cookie, "accessToken");
}

export function authMiddleware(req, res, next) {
  const token = accessTokenFrom(req);
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
