import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(token) {
  if (!token) throw new Error("Refresh token required");
  // Validate the refresh token exists and is valid
  // In production this would check against stored refresh tokens
  if (typeof token !== "string" || token.length < 10) {
    throw new Error("Invalid refresh token");
  }
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
