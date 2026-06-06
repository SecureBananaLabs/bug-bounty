import { signAccessToken } from "../utils/jwt.js";
import { createResourceId } from "../utils/id.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const userId = createResourceId("usr");

  return {
    id: userId,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: userId, role: payload.role })
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
