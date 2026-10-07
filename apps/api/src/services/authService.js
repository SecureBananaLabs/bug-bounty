import { signAccessToken } from "../utils/jwt.js";

const registeredUsers = new Map();

export async function registerUser(payload) {
  const id = `usr_${Date.now()}`;
  registeredUsers.set(payload.email, {
    id,
    email: payload.email,
    password: payload.password,
    role: payload.role
  });

  return {
    id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  const registeredUser = registeredUsers.get(payload.email);
  if (!registeredUser || registeredUser.password !== payload.password) {
    return null;
  }

  return {
    email: registeredUser.email,
    token: signAccessToken({ sub: registeredUser.id, role: registeredUser.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
