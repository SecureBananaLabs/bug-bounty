import { signAccessToken } from "../utils/jwt.js";
import { createUser, findUserByEmail } from "./userService.js";

export async function registerUser(payload) {
  if (payload.role === "admin") {
    const err = new Error("Admin role cannot be self-assigned");
    err.status = 400;
    throw err;
  }

  const existing = await findUserByEmail(payload.email);
  if (existing) {
    const err = new Error("User with this email already exists");
    err.status = 400;
    throw err;
  }

  const user = await createUser({
    email: payload.email,
    password: payload.password,
    role: payload.role || "client"
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function loginUser(payload) {
  const user = await findUserByEmail(payload.email);
  if (!user || user.password !== payload.password) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, role: user.role })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
