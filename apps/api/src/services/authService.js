import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // Generate the user ID once so it is consistent everywhere
  const id = `usr_${Date.now()}`;

  // Return the user with the same ID that was used to sign the access token.
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
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
