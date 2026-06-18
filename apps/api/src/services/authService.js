import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

// In-memory user store for demo (TODO: replace with DB/Prisma)
const users = new Map();

export async function registerUser(payload) {
  const now = Date.now();
  // Fix: single timestamp for both ID and token (was double Date.now() — race condition)
  const userId = `usr_${now}`;

  // Prevent duplicate email registration
  if (users.has(payload.email)) {
    throw new Error(`User already exists: ${payload.email}`);
  }

  const user = {
    id: userId,
    email: payload.email,
    role: payload.role, // "admin" already blocked at validator level (#1466)
  };
  users.set(payload.email, user);

  return {
    ...user,
    token: signAccessToken({ sub: userId, role: payload.role })
  };
}

export async function loginUser(payload) {
  // Fix #1471 (1/2): Validate credentials are actually provided
  if (!payload.email || !payload.password) {
    const missing = [];
    if (!payload.email) missing.push("email");
    if (!payload.password) missing.push("password");
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }

  // Fix #1471 (2/2): Verify user exists — previously returned valid token for ANY input
  const user = users.get(payload.email);
  if (!user) {
    throw new Error("Invalid email or password"); // Generic error prevents enumeration
  }

  // TODO: verify password hash against stored hash (e.g., bcrypt.compare)
  // For now, accept any non-empty password for existing users

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken(refreshTokenString) {
  // Fix #1471 (3/3): Require a valid refresh token — previously took NO arguments
  // and unconditionally returned a valid access token (complete auth bypass)
  if (!refreshTokenString || typeof refreshTokenString !== "string") {
    throw new Error("Refresh token is required");
  }

  try {
    const decoded = verifyAccessToken(refreshTokenString);
    // TODO: check refresh token against stored session / blacklist / rotation
    return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
  } catch (validationError) {
    throw new Error("Invalid or expired refresh token");
  }
}
