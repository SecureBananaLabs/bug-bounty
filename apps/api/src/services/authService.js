import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

export async function loginUser(payload) {
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(oldToken) {
  if (!oldToken) {
    throw new Error("Refresh token required");
  }
  const decoded = verifyAccessToken(oldToken);
  return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
}
