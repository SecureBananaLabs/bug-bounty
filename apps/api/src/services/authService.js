import { signAccessToken } from "../utils/jwt.js";
import { createUser, listUsers } from "./userService.js";

export async function registerUser(payload) {
  const user = await createUser({
    email: payload.email,
    role: payload.role,
    password: payload.password
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const users = await listUsers();
  const user = users.find(u => u.email === payload.email && u.password === payload.password);
  
  if (!user) {
    throw new Error("Invalid credentials");
  }

  return {
    email: user.email,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
