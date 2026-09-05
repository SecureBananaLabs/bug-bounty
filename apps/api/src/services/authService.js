import { signAccessToken } from "../utils/jwt.js";

const REGISTRATION_ROLES = {
  client: "CLIENT",
  freelancer: "FREELANCER"
};

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  const role = normalizeRegistrationRole(payload.role);
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role })
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

function normalizeRegistrationRole(role = "client") {
  const canonicalRole = REGISTRATION_ROLES[role];
  if (!canonicalRole) {
    throw new Error("Unsupported registration role");
  }

  return canonicalRole;
}
