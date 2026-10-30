import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

const DEMO_USERS = [
  { email: "demo@example.com", password: "password1", id: "usr_demo", role: "client" }
];

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  return { id, email: payload.email, fullName: payload.fullName, role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role }) };
}

export async function loginUser(payload) {
  // TODO: replace DEMO_USERS with real DB lookup + bcrypt.compare
  const user = DEMO_USERS.find((u) => u.email === payload.email && u.password === payload.password);
  if (!user) throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  return { id: user.id, email: user.email, role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role }) };
}

export async function refreshToken(token) {
  if (!token) throw Object.assign(new Error("Refresh token required"), { status: 401 });
  const decoded = verifyAccessToken(token);
  return { token: signAccessToken({ sub: decoded.sub, role: decoded.role }) };
}
