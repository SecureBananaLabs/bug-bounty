import { copyRecord, copyRecords } from "./copyRecord.js";

const users = [];

export async function listUsers() {
  return copyRecords(users);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return copyRecord(user);
}
