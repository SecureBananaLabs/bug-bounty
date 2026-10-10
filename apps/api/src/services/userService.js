import { snapshotList } from "./listSnapshot.js";

const users = [];

export async function listUsers() {
  return snapshotList(users);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
