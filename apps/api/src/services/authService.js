import { signAccessToken } from "../utils/jwt.js";

const authUsers = [];

export async function registerUser(payload) {
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    password: payload.password,
    role: payload.role
  };
  authUsers.push(user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = authUsers.find((candidate) => candidate.email === payload.email);
  if (!user || user.password !== payload.password) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
