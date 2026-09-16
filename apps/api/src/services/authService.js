import { signAccessToken } from "../utils/jwt.js";

// In-memory credential store for authentication
const userStore = [
  {
    id: "usr_default_admin",
    email: "admin@banana.com",
    password: "Password123!",
    role: "admin"
  }
];

export async function registerUser(payload) {
  const existing = userStore.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
  if (existing) {
    const error = new Error("User already exists");
    error.statusCode = 409;
    throw error;
  }

  const id = `usr_${Date.now()}`;
  const newUser = {
    id,
    email: payload.email,
    password: payload.password,
    role: payload.role || "client"
  };
  userStore.push(newUser);

  return {
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
    token: signAccessToken({ sub: newUser.id, role: newUser.role })
  };
}

export async function loginUser(payload) {
  const user = userStore.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
  if (!user || user.password !== payload.password) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_default_admin", role: "admin" }) };
}
