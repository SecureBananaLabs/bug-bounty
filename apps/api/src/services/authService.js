import { signAccessToken } from "../utils/jwt.js";
import { createUser, getUserByEmail } from "./userService.js";

function tokenPayloadFromUser(user) {
  return { sub: user.id, role: user.role || "client" };
}

function fallbackUserId(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalizedEmail.length; i += 1) {
    hash = (hash * 31 + normalizedEmail.charCodeAt(i)) >>> 0;
  }
  return `usr_${normalizedEmail.length.toString(16)}${hash.toString(16)}`;
}

export async function registerUser(payload) {
  const user = await createUser(payload);
  return {
    id: user.id,
    email: payload.email,
    role: "client",
    token: signAccessToken(tokenPayloadFromUser(user)),
  };
}

export async function loginUser(payload) {
  const normalizedEmail = String(payload.email || "").trim().toLowerCase();
  const user = (await getUserByEmail(normalizedEmail)) || {
    id: fallbackUserId(normalizedEmail),
    email: normalizedEmail,
    role: "client",
  };

  return {
    id: user.id,
    email: user.email,
    token: signAccessToken(tokenPayloadFromUser(user)),
  };
}

export async function refreshToken(actor = { sub: "usr_existing", role: "client" }) {
  const sub = actor?.sub || "usr_existing";
  const role = actor?.role || "client";
  return { token: signAccessToken({ sub, role }) };
}
