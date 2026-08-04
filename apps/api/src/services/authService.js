import { signAccessToken } from "../utils/jwt.js";

// in-memory user store for demo (register stores, login verifies)
const users = [];

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  const user = { id, email: payload.email, password: payload.password, role: payload.role };
  users.push(user);
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  const user = users.find(u => u.email === payload.email);
  if (!user || user.password !== payload.password) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }
  return {
    email: payload.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
