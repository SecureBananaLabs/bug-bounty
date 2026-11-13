import crypto from "node:crypto";

const users = [];

export async function listUsers() {
  return [...users];
}

export async function createUser(payload = {}) {
  const safePayload =
    payload !== null && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const { id: _ignoredId, ...rest } = safePayload;
  const user = {
    ...rest,
    id: `usr_${crypto.randomUUID()}`
  };
  users.push(user);
  return user;
}
