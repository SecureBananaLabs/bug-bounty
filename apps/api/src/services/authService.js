import { signAccessToken } from "../utils/jwt.js";
import { createEntityId } from "../utils/ids.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const id = createEntityId("usr");
  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
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
