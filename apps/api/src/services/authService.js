import { signAccessToken } from "../utils/jwt.js";

// In-memory user store for auth (matches stub pattern in userService / jobService)
const users = [
  {
    id: "usr_9",
    email: "admin@test.com",
    password: "password123",
    name: "Admin User",
    role: "admin",
    status: "active",
    createdAt: new Date("2025-01-01").toISOString()
  },
  {
    id: "usr_1",
    email: "alice@test.com",
    password: "password123",
    name: "Alice Johnson",
    role: "client",
    status: "active",
    createdAt: new Date("2025-01-15").toISOString()
  },
  {
    id: "usr_2",
    email: "bob@test.com",
    password: "password123",
    name: "Bob Smith",
    role: "freelancer",
    status: "active",
    createdAt: new Date("2025-02-20").toISOString()
  }
];

let idCounter = 10;

export async function registerUser(payload) {
  const id = `usr_${idCounter++}`;
  const user = {
    id,
    email: payload.email,
    password: payload.password,
    name: payload.name || payload.email.split("@")[0],
    role: payload.role || "client",
    status: "active",
    createdAt: new Date().toISOString()
  };
  users.push(user);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role, name: user.name })
  };
}

export async function loginUser(payload) {
  const user = users.find(u => u.email === payload.email && u.password === payload.password);
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }
  if (user.status === "suspended" || user.status === "banned") {
    throw Object.assign(new Error("Account is " + user.status), { status: 403 });
  }
  return {
    email: user.email,
    name: user.name,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role, name: user.name })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_9", role: "admin", name: "Admin User" }) };
}
