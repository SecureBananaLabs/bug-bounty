import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const userId = `usr_${Date.now()}`;
  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: userId, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  // In production, look up the user's actual role from the database
  const userRole = "freelancer"; // Placeholder - would come from DB
  return {
    email: payload.email,
    role: userRole,
    token: signAccessToken({ sub: "usr_existing", role: userRole })
  };
}

export async function refreshToken(token) {
  // Verify the provided refresh token before issuing a new one
  const decoded = verifyAccessToken(token);
  return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
}
