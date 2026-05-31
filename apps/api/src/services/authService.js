import { signAccessToken } from "../utils/jwt.js";

const DEFAULT_ROLE = "client";

export async function registerUser(payload) {
  // Generate user ID once and reuse for both response and token subject
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role: DEFAULT_ROLE,
    token: signAccessToken({ sub: id, role: DEFAULT_ROLE })
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
