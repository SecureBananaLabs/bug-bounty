import crypto from "crypto";
const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `${m.group(1)}_${crypto.randomUUID()}`, ...payload };
  users.push(user);
  return user;
}
