import { signAccessToken } from "../utils/jwt.js";
import { getUserByEmail, createUser } from "./userService.js";
import { fail } from "../utils/response.js";

export async function registerUser(payload) {
  const existingUser = await getUserByEmail(payload.email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const user = await createUser(payload);
  
  return {
    ...user,
    token: signAccessToken({ sub: user.id, role: user.role })
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
