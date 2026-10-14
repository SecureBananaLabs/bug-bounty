import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  // IMPORTANT: generate the id once and reuse it for both the returned
  // user object and the JWT subject. Two separate Date.now() calls produce
  // different timestamps — the token's sub would never match the user id.
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: look up user by email in database and verify password hash.
  // For now simulate a user lookup that preserves the actual role.
  // Previously this always returned role:'client', meaning admins and
  // freelancers received tokens that failed all RBAC checks.
  const mockUser = {
    id: "usr_existing",
    email: payload.email,
    role: payload.role ?? "client"
  };
  return {
    email: mockUser.email,
    token: signAccessToken({ sub: mockUser.id, role: mockUser.role })
  };
}

export async function refreshToken(user) {
  // user comes from req.user (verified JWT claims) — not hardcoded.
  return { token: signAccessToken({ sub: user.sub, role: user.role }) };
}

