import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role }),
    refreshToken: signRefreshToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" }),
    refreshToken: signRefreshToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(token) {
  if (!token) throw new Error("No refresh token provided");
  const decoded = verifyRefreshToken(token);
  return { 
    token: signAccessToken({ sub: decoded.sub, role: decoded.role }),
    refreshToken: signRefreshToken({ sub: decoded.sub, role: decoded.role })
  };
}
