import { snapshotRecord } from "./recordSnapshot.js";

const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = snapshotRecord({ id: `usr_${Date.now()}`, ...payload });
  users.push(user);
  return snapshotRecord(user);
}
