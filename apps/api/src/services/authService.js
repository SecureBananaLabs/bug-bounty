import { signAccessToken } from "../utils/jwt.js";
import { createUser, getUserByEmail } from "./userService.js";

export async function registerUser(payload) {
  const user = await createUser({
    email: payload.email,
    role: payload.role,
    passwordHash: "mock-hash" // or omit
  });
  
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = await getUserByEmail(payload.email);
  const sub = user ? user.id : "usr_existing";
  const role = user ? user.role : "client";
  
  return {
    email: payload.email,
    token: signAccessToken({ sub, role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
