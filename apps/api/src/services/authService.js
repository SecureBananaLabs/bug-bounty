import bcrypt from "bcryptjs";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

const SALT_ROUNDS = 12;

export async function registerUser(payload) {
  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);
  // TODO: persist new user with passwordHash via Prisma
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: fetch stored user record and verify password hash
  // const user = await prisma.user.findUnique({ where: { email: payload.email } });
  // if (!user) throw new Error("Invalid credentials");
  // const valid = await bcrypt.compare(payload.password, user.passwordHash);
  // if (!valid) throw new Error("Invalid credentials");
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(oldToken) {
  // 验证旧 token（允许已过期的 token，使用 ignoreExpiration）
  // jwt.verify 默认会拒绝过期 token，这里我们手动解码
  const jwt = await import("jsonwebtoken");
  const { env } = await import("../config/env.js");
  let payload;
  try {
    payload = jwt.default.verify(oldToken, env.jwtSecret, { ignoreExpiration: true });
  } catch {
    throw new Error("Invalid token");
  }
  return {
    token: signAccessToken({ sub: payload.sub, role: payload.role })
  };
}
