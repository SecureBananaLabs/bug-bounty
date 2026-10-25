import { signAccessToken } from "../utils/jwt.js";
import bcrypt from "bcryptjs";

// In-memory user store (mirrors userService.js)
const users = [];

export async function registerUser(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    passwordHash,
    role: payload.role ?? "CLIENT",
  };
  users.push(user);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role }),
  };
}

export async function loginUser(payload) {
  const user = users.find((u) => u.email === payload.email);
  // When Prisma is wired, look up from DB; fall back to in-memory store
  const dbUser = await getDbUserByEmail(payload.email);
  const foundUser = dbUser ?? user;
  if (!foundUser) {
    throw new Error("Invalid credentials");
  }
  const passwordHash = foundUser.passwordHash ?? (user ? user.passwordHash : null);
  if (!passwordHash) {
    throw new Error("Invalid credentials");
  }
  const valid = await bcrypt.compare(payload.password, passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }
  return {
    email: foundUser.email,
    token: signAccessToken({ sub: foundUser.id, role: foundUser.role }),
  };
}

// Placeholder — replace with Prisma call once DB is wired
async function getDbUserByEmail(email) {
  return null;
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}