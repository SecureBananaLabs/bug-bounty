// Auth service with security fixes for #4318, #4359
import { signAccessToken } from "../utils/jwt.js";

const registeredUsers = [];

export async function registerUser(payload) {
  // Fix #4359: Remove admin from allowed registration roles
  const safeRole = payload.role === "admin" ? "client" : payload.role;
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: safeRole
  };
  registeredUsers.push({ ...user, password: payload.password });
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  // Fix #4318: Validate credentials against registered users
  const user = registeredUsers.find(
    u => u.email === payload.email && u.password === payload.password
  );
  if (!user) {
    const error = new Error("Invalid email or password");
    error.name = "AuthenticationError";
    error.status = 401;
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
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
