import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  // Never allow admin role through public registration
  const role = payload.role === "admin" ? "client" : payload.role;
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(token) {
  if (!token) {
    throw new Error("Refresh token is required");
  }
  
  try {
    const decoded = verifyAccessToken(token);
    return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }
}
