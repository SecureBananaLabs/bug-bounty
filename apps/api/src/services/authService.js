import { signAccessToken } from "../utils/jwt.js";

// In-memory user store (TODO: replace with Prisma)
const registeredUsers = [];

export function storeUser(user) {
  registeredUsers.push(user);
}

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    password: payload.password,
    role: payload.role,
  };
  storeUser(user);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

export async function loginUser(payload) {
  // Look up registered user by email
  const user = registeredUsers.find((u) => u.email === payload.email);
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }
  // Verify password matches the stored user record
  if (user.password !== payload.password) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }
  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}