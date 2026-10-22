import { signAccessToken } from "../utils/jwt.js";
import bcrypt from "bcryptjs";

const users = [];

export async function registerUser(payload) {
  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role || "client",
    password: hashedPassword,
  };
  users.push(user);
  return {
    id: user.id, email: user.email, role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

export async function loginUser(payload) {
  const user = users.find((u) => u.email === payload.email);
  if (!user) throw new Error("Invalid email or password");
  const valid = await bcrypt.compare(payload.password, user.password);
  if (!valid) throw new Error("Invalid email or password");
  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

export async function refreshToken(token) {
  if (!token) throw new Error("Refresh token is required");
  const { verifyToken } = await import("../utils/jwt.js");
  const decoded = verifyToken(token);
  return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
}
