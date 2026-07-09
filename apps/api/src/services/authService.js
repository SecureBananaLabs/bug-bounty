import { signAccessToken } from "../utils/jwt.js";
import { createUser, listUsers } from "./userService.js";
import crypto from "crypto";

export async function registerUser(payload) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(payload.password, salt, 1000, 64, "sha512").toString("hex");
  const passwordHash = `${salt}:${hash}`;
  
  const user = await createUser({
    email: payload.email,
    passwordHash,
    role: payload.role
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const users = await listUsers();
  const user = users.find((u) => u.email === payload.email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const [salt, originalHash] = user.passwordHash.split(":");
  const hash = crypto.pbkdf2Sync(payload.password, salt, 1000, 64, "sha512").toString("hex");
  if (hash !== originalHash) {
    throw new Error("Invalid credentials");
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
