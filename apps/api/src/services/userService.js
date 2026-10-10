import { createServiceId } from "../utils/ids.js";

const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { ...payload, id: createServiceId("usr") };
  users.push(user);
  return user;
}
