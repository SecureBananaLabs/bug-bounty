import { signAccessToken } from "../utils/jwt.js";

const registeredUsers = [];

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const id = `usr_${Date.now()}`;
  const user = {
    id,
    email: payload.email,
    password: payload.password,
    role: payload.role
  };
  registeredUsers.push(user);

  return {
    id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: id, role: user.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const user = registeredUsers.find((candidate) => candidate.email === payload.email);

  if (!user || user.password !== payload.password) {
    return null;
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
