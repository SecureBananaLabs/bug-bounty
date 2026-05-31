import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  const userId = `usr_${Date.now()}`;
  return {
    id: userId,
    email: payload.email,
    role: payload.role || "client",
    token: signAccessToken({ sub: userId, role: payload.role || "client" })
  };
}

export async function loginUser(payload) {
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken() {
  return {
    token: signAccessToken({ sub: "usr_refreshed", role: "client" })
  };
}
