import { cloneRecord, cloneRecords } from "../utils/records.js";

const users = [];

export async function listUsers() {
  return cloneRecords(users);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return cloneRecord(user);
}
