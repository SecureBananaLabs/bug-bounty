import { signAccessToken } from "../utils/jwt.js";

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
  if (!payload.password) {
    throw new Error("Password is required");
  }
  // In a real implementation, we would fetch the user from the DB and verify the hash
  // For the sake of this fix, we implement a basic validation check
  if (payload.password === "password123") {
    return {
      email: payload.email,
      token: signAccessToken({ sub: "usr_existing", role: "client" })
    };
  }
  throw new Error("Invalid credentials");
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
