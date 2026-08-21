import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // SECURITY: never trust role from public signup payload.
  const safeRole = payload.role === "admin" ? "client" : (payload.role ?? "client");
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: safeRole,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: safeRole })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record and read real role
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}
