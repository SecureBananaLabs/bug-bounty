import { randomUUID } from "node:crypto";
import { signAccessToken } from "../utils/jwt.js";

export function createRegisteredUser(payload, id = `usr_${randomUUID()}`) {
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  return createRegisteredUser(payload);
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
