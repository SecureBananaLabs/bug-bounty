import { signAccessToken } from "../utils/jwt.js";

const registeredUsersByEmail = new Map();

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function duplicateEmailError(email) {
  const error = new Error(`User with email ${email} already exists`);
  error.status = 409;
  return error;
}

export async function registerUser(payload) {
  const email = normalizeEmail(payload.email);
  if (registeredUsersByEmail.has(email)) {
    throw duplicateEmailError(email);
  }

  // TODO: persist new user via Prisma
  const user = {
    id: `usr_${Date.now()}`,
    email,
    role: payload.role
  };
  registeredUsersByEmail.set(email, user);

  return {
    ...user,
    token: signAccessToken({ sub: user.id, role: user.role })
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
