import { signAccessToken } from "../utils/jwt.js";

const store = new Map();

export async function registerUser(payload) {
  // Block admin self-assignment — role may only be client or freelancer
  const safeRole = payload.role === "admin" ? "client" : (payload.role ?? "client");

  const id = `usr_${Date.now()}`;
  const user = { id, email: payload.email, role: safeRole };

  // Persist (mock store)
  store.set(payload.email, { ...user, password: payload.password });

  // Token sub uses the same id that is returned so sub === id
  const token = signAccessToken({ sub: id, role: safeRole });

  return { id, email: payload.email, role: safeRole, token };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  const stored = store.get(payload.email);
  if (!stored) {
    // User not in mock store — create ephemeral entry for unknown emails
    const id = `usr_${Date.now()}`;
    const token = signAccessToken({ sub: id, role: "client" });
    return { id, email: payload.email, role: "client", token };
  }

  const token = signAccessToken({ sub: stored.id, role: stored.role });
  // Return id and role — required for client session setup
  return { id: stored.id, email: stored.email, role: stored.role, token };
}

export async function refreshToken(existingToken) {
  if (!existingToken) {
    throw new Error("Refresh token required");
  }
  // TODO: real refresh token rotation
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
