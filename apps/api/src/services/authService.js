import crypto from "crypto";
import { signAccessToken } from "../utils/jwt.js";

const users = [];

export async function registerUser(payload) {
  const userId = `usr_${crypto.randomUUID()}`;
  const user = { id: userId, ...payload };
  users.push(user);
  const token = signAccessToken({ sub: userId, role: payload.role });
  return { user, token };
}

export async function loginUser(payload) {
  const user = users.find(u => u.email === payload.email);
  if (!user) throw new Error("Invalid credentials");
  const token = signAccessToken({ sub: user.id, role: user.role });
  return { user, token };
}

export async function refreshToken() {
  // TODO: implement refresh token logic
  return { token: "placeholder" };
}
