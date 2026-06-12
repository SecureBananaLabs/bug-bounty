import { createId } from "../utils/ids.js";

const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { id, ...userPayload } = payload;
  const user = { ...userPayload, id: createId("usr") };
  users.push(user);
  return user;
}

export function resetUsers() {
  users.length = 0;
}
