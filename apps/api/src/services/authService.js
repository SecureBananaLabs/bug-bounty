import { signAccessToken } from "../utils/jwt.js";

const users = new Map();

export async function registerUser(payload) {
  const id = "usr_" + Date.now();
  users.set(id, { id: id, email: payload.email, password: payload.password, role: payload.role });
  return {
    id: id,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: id, role: payload.role })
  };
}

export async function loginUser(payload) {
  let foundUser = null;
  for (const [id, user] of users) {
    if (user.email === payload.email) {
      foundUser = { id: id, ...user };
      break;
    }
  }
  if (!foundUser) return null;
  if (foundUser.password !== payload.password) return null;
  return {
    email: foundUser.email,
    token: signAccessToken({ sub: foundUser.id, role: foundUser.role })
  };
}
