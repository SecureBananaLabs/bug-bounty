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
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(incomingToken) {
  if (!incomingToken) {
    const err = new Error("Refresh token required");
    err.status = 401;
    throw err;
  }
  // Verify the incoming token and extract the subject
  const decoded = verifyAccessToken(incomingToken);
  // Issue a fresh access token for the same subject
  return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
}
