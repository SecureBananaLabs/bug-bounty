import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

const DEFAULT_ROLE = "client";

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  const role = DEFAULT_ROLE; // Always use safe default, never trust payload.role
  return {
    id,
    email: payload.email,
    role,
    token: signAccessToken({ sub: id, role })
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
  if (!token) {
    throw new Error("Refresh token is required");
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  // Preserve the subject and role from the original token
  const { sub, role } = decoded;
  if (!sub) {
    throw new Error("Invalid token: missing subject");
  }

  return { token: signAccessToken({ sub, role: role ?? DEFAULT_ROLE }) };
}
