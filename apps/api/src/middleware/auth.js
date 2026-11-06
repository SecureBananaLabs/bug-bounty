import { fail } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/db.js";

export function createAuthMiddleware({ database = prisma, tokenVerifier = verifyAccessToken } = {}) {
  return async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return fail(res, "Unauthorized", 401);
    }

    let claims;
    try {
      claims = tokenVerifier(authHeader.slice(7));
    } catch {
      return fail(res, "Invalid token", 401);
    }

    if (typeof claims?.sub !== "string" || !claims.sub) {
      return fail(res, "Invalid token", 401);
    }

    try {
      const user = await database.user.findUnique({
        where: { id: claims.sub },
        select: { id: true, email: true, role: true }
      });
      if (!user) {
        return fail(res, "Invalid token", 401);
      }

      req.user = {
        sub: user.id,
        email: user.email,
        role: user.role.toLowerCase()
      };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export const authMiddleware = createAuthMiddleware();
