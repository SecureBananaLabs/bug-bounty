import { signAccessToken } from "../utils/jwt.js";

// Demo in-memory store for staging/bounty API (not production-grade hashing).
const usersByEmail = new Map();

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  usersByEmail.set(payload.email.toLowerCase(), {
    id,
    email: payload.email,
    role: payload.role,
    password: payload.password
  });
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  const existing = usersByEmail.get(payload.email.toLowerCase());
  if (!existing || existing.password !== payload.password) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }
  return {
    email: existing.email,
    token: signAccessToken({ sub: existing.id, role: existing.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
