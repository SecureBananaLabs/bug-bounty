import { createPrefixedId } from "../utils/id.js";

const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { ...payload, id: createPrefixedId("usr") };
  users.push(user);
  return user;
}
