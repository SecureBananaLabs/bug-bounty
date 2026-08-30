import { randomUUID } from "crypto";

const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload = {}) {
  const { id: _ignoredId, ...safePayload } = payload;
  const user = {
    ...safePayload,
    id: `usr_${Date.now()}_${randomUUID().slice(0, 8)}`,
  };
  users.push(user);
  return user;
}
