import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // Defense-in-depth: Prevent admin role self-assignment
  if (payload.role === "admin") {
    const err = new Error("Admin role cannot be self-assigned");
    err.status = 400;
    throw err;
  }

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

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
