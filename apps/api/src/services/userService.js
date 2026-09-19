import { createPublicId } from "../utils/publicId.js";

const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: createPublicId("usr"), ...payload };
  users.push(user);
  return user;
}
