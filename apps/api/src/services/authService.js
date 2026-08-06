import { signAccessToken } from "../utils/jwt.js";

const users = [];

export async function registerUser(payload) {
  const existing = users.find(u => u.email === payload.email);
  if (existing) {
    throw { status: 409, message: "User already exists" };
  }
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    password: payload.password,
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
  const user = users.find(u => u.email === payload.email);
  if (!user) {
    throw { status: 401, message: "Invalid email or password" };
  }
  if (user.password !== payload.password) {
    throw { status: 401, message: "Invalid email or password" };
  }
  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}