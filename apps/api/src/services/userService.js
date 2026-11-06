import { createEntityId } from "../utils/ids.js";

const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: createEntityId("usr"), ...payload };
  users.push(user);
  return user;
}
