const users = [];

const FORBIDDEN_SELF_ASSIGN_ROLES = ["admin"];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // Security: strip admin role from user-supplied payload to prevent self-assignment
  const { role, ...safePayload } = payload;
  const safeRole = role && !FORBIDDEN_SELF_ASSIGN_ROLES.includes(role) ? role : "client";
  const user = { id: `usr_${Date.now()}`, ...safePayload, role: safeRole };
  users.push(user);
  return user;
}
