import { signAccessToken } from "../utils/jwt.js";
import { createUser, listUsers } from "./userService.js";

export async function registerUser(payload) {
  const user = await createUser(payload);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const usersList = await listUsers();
  const user = usersList.find((u) => u.email === payload.email);

  if (!user || user.password !== payload.password) {
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
