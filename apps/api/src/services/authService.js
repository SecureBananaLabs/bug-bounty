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
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  const sub = decoded.sub;
  const role = decoded.role || "client";

  if (!sub) {
    throw new Error("Invalid token payload: missing subject");
  }

  return {
    token: signAccessToken({ sub, role }),
    user: { sub, role }
  };
}
