import { randomUUID } from "node:crypto";

const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = {
    ...payload,
    id: `usr_${Date.now()}_${randomUUID()}`,
  };
  users.push(user);
  return user;
}
