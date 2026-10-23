import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  const userId = `usr_${Date.now()}`;
  const fullName =
    typeof payload?.fullName === "string" ? payload.fullName.trim() : payload?.fullName;
  const role = payload?.role ?? "client";
  return {
    id: userId,
    email: payload?.email,
    fullName,
    role,
    token: signAccessToken({ sub: userId, role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
