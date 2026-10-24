import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

const BLOCKED_ROLES = ["admin", "superadmin", "moderator"];

export async function registerUser(payload) {
  if (BLOCKED_ROLES.includes(payload.role)) {
    throw Object.assign(new Error("Cannot self-assign privileged role"), { status: 400 });
  }
  // Generate id ONCE — must be identical in stored record and JWT sub
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role ?? "client",
    token: signAccessToken({ sub: id, role: payload.role ?? "client" })
  };
}

export async function loginUser(payload) {
  // TODO: replace with real DB lookup + bcrypt.compare
  // Reject unconditionally until real auth is wired — no free tokens
  if (!payload.email || !payload.password) {
    throw Object.assign(new Error("Email and password are required"), { status: 400 });
  }
  // Stub: only known demo account works; real DB lookup goes here
  const DEMO = [{ email: "demo@example.com", password: "password1", id: "usr_demo", role: "client", fullName: "Demo User" }];
  const user = DEMO.find((u) => u.email === payload.email && u.password === payload.password);
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken(token) {
  if (!token) {
    throw Object.assign(new Error("Refresh token is required"), { status: 401 });
  }
  // Validate the existing token before issuing a new one
  const decoded = verifyAccessToken(token);
  return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
}
