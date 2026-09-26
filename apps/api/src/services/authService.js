import { signAccessToken } from "../utils/jwt.js";

const registeredUsers = new Map();

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email already registered");
    this.name = "DuplicateEmailError";
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const email = normalizeEmail(payload.email);

  if (registeredUsers.has(email)) {
    throw new DuplicateEmailError();
  }

  const id = `usr_${Date.now()}`;
  const user = {
    id,
    email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };

  registeredUsers.set(email, user);
  return user;
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
