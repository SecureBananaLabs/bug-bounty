import { signAccessToken } from "../utils/jwt.js";

const registeredEmails = new Set();

export async function registerUser(payload) {
  // Normalize email for case-insensitive uniqueness check
  const normalizedEmail = payload.email.toLowerCase().trim();
  
  if (registeredEmails.has(normalizedEmail)) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }
  
  registeredEmails.add(normalizedEmail);
  
  // TODO: persist new user via Prisma
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
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
