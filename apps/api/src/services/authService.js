import { signAccessToken } from "../utils/jwt.js";

// Mock user store for demonstration
const users = [
  { id: "usr_1", email: "client@example.com", role: "client", password: "password123" },
  { id: "usr_2", email: "freelancer@example.com", role: "freelancer", password: "password123" },
  { id: "usr_3", email: "admin@example.com", role: "admin", password: "password123" }
];

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  const user = { id, email: payload.email, role: payload.role ?? "client" };
  users.push(user);
  return {
    id,
    email: payload.email,
    role: user.role,
    token: signAccessToken({ sub: id, role: user.role })
  };
}

export async function loginUser(payload) {
  // Find user by email (in real implementation, this would query the database)
  const user = users.find(u => u.email === payload.email);
  
  // For mock implementation, default to client role if user not found
  const role = user?.role ?? "client";
  const sub = user?.id ?? `usr_${Date.now()}`;
  
  return {
    email: payload.email,
    role,
    token: signAccessToken({ sub, role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
