import { signAccessToken } from "../utils/jwt.js";

const registeredUsers = [];

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const existing = registeredUsers.find(u => u.email === payload.email);
  if (existing) {
    const err = new Error("A user with this email already exists");
    err.code = "EMAIL_ALREADY_REGISTERED";
    err.status = 409;
    throw err;
  }

  const id = `usr_${Date.now()}`;
  const user = {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
  registeredUsers.push({ id, email: payload.email });
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
