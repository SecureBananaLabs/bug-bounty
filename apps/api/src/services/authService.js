import bcrypt from "bcryptjs";
import { signAccessToken } from "../utils/jwt.js";
import { createUser, findUserByEmail } from "./userService.js";

const SALT_ROUNDS = 12;

export async function registerUser(payload) {
  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS);
  const id = `usr_${Date.now()}`;

  const user = await createUser({
    email: payload.email,
    role: payload.role,
    password: hashedPassword
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = await findUserByEmail(payload.email);
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const valid = await bcrypt.compare(payload.password, user.password);
  if (!valid) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken(userId) {
  return { token: signAccessToken({ sub: userId, role: "client" }) };
}
