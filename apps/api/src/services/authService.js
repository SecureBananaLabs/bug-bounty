import { signToken } from "../utils/jwt.js";

const users = new Map();

export async function registerUser({ email, password, name }) {
  if (users.has(email)) {
    throw new Error("User already exists");
  }

  const userId = Date.now().toString();
  const user = {
    id: userId,
    email,
    name,
    password,
    role: "user"
  };

  users.set(email, user);

  const token = signToken({ sub: userId, role: "user" });

  return {
    id: userId,
    email,
    name,
    role: "user",
    token
  };
}

export async function loginUser({ email, password }) {
  const user = users.get(email);
  if (!user || user.password !== password) {
    throw new Error("Invalid credentials");
  }

  const token = signToken({ sub: user.id, role: user.role });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token
  };
}

export async function refreshToken() {
  return { status: "refresh-token-placeholder" };
}
