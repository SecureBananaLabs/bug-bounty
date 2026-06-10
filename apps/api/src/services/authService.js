import { randomUUID } from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

const registeredUsers = new Map();

export async function registerUser(payload) {
  const id = `usr_${randomUUID()}`;
  const user = {
    id,
    email: payload.email,
    password: payload.password,
    role: payload.role
  };

  registeredUsers.set(user.email, user);

  return {
    id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = registeredUsers.get(payload.email);
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
