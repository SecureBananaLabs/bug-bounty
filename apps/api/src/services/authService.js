import { signAccessToken } from "../utils/jwt.js";

const registeredEmails = new Set();

export async function registerUser(payload) {
  const emailKey = payload.email.trim().toLowerCase();
  if (registeredEmails.has(emailKey)) {
    const error = new Error("Email already registered");
    error.status = 409;
    error.code = "AUTH_EMAIL_EXISTS";
    throw error;
  }

  // TODO: persist new user via Prisma
  registeredEmails.add(emailKey);
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
