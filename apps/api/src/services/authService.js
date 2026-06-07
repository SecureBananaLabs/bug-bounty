import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(token) {
  // 验证 refresh token 有效性
  const decoded = verifyAccessToken(token);
  
  // 使用原 token 中的 sub 和 role 签发新的 access token
  return {
    token: signAccessToken({ sub: decoded.sub, role: decoded.role })
  };
}
