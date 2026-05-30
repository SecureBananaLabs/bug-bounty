import { signAccessToken } from "../utils/jwt.js";

const users = [];

export async function registerUser(payload) {
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
  users.push(user);
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function loginUser(payload) {
  const user = users.find(u => u.email === payload.email && u.password === payload.password);
  if (!user) return null;
  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken(token) {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
