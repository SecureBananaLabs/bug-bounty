import { signAccessToken } from "../utils/jwt.js";

const users = [];

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
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
  const user = users.find((u) => u.email === payload.email);
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
