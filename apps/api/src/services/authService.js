import { signAccessToken } from "../utils/jwt.js";

const registeredUsers = [];

export async function registerUser(payload) {
  const userId = `usr_${Date.now()}`;
  const user = {
    id: userId,
    email: payload.email,
    password: payload.password,
    role: payload.role
  };
  registeredUsers.push(user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = registeredUsers.find((entry) => entry.email === payload.email);
  if (!user || user.password !== payload.password) {
    throw new Error("Invalid credentials");
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
