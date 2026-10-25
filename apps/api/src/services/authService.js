import { signAccessToken } from "../utils/jwt.js";

const registeredUsers = new Map(); // email -> user

export async function registerUser(payload) {
  const normalizedEmail = payload.email.toLowerCase().trim();
  if (registeredUsers.has(normalizedEmail)) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }
  const id = `usr_${Date.now()}`;
  const user = { id, email: normalizedEmail, role: payload.role };
  registeredUsers.set(normalizedEmail, user);
  return { ...user, token: signAccessToken({ sub: id, role: payload.role }) };
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
