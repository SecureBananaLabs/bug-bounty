import { signAccessToken } from "../utils/jwt.js";

const users = [];

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const duplicate = users.find((u) => u.email === payload.email);
  if (duplicate) {
    const err = new Error("Email address is already registered");
    err.status = 409;
    throw err;
  }
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role
  };
  users.push(user);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
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
