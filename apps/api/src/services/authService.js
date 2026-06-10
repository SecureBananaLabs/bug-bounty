import { signAccessToken } from "../utils/jwt.js";

function generateUserId() {
  return `usr_${Date.now()}`;
}

export async function registerUser(payload) {
  return {
    id: generateUserId(),
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: generateUserId(), role: payload.role })
  };
}

  return {
    email: payload.email,
    token: signAccessToken({ sub: generateUserId(), role: payload.role })
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

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
}
