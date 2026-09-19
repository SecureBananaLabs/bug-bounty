import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

// In-memory mock user store (replace with Prisma/DB in production)
const mockUsers = new Map();

export async function registerUser(payload) {
  // TODO: persist new user via Prisma, hash password with bcrypt
  const id = `usr_${Date.now()}`;
  mockUsers.set(id, { id, email: payload.email, password: payload.password, role: payload.role });
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  const { email, password } = payload;
  if (!password || password.length < 8) {
    throw new Error("Invalid credentials");
  }
  // Find user by email and verify password (use bcrypt.compare in production)
  for (const [, user] of mockUsers) {
    if (user.email === email && user.password === password) {
      return { email: user.email, token: signAccessToken({ sub: user.id, role: user.role }) };
    }
  }
  throw new Error("Invalid email or password");
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
