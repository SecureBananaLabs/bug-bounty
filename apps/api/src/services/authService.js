import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  const role = payload.role === "admin" ? "client" : payload.role;
  const id = `usr_${Date.now()}`;
  return {
    id,
    email: payload.email,
    role,
    token: signAccessToken({ sub: id, role })
  };
}

export async function loginUser(payload) {
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken(user) {
  const sub = user?.sub ?? "usr_existing";
  const role = user?.role ?? "client";
  return { token: signAccessToken({ sub, role }) };
}
