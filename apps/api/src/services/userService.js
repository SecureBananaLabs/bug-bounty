import { createId } from "@paralleldrive/cuid2";

const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = {
    id: createId(),
    role: "CLIENT",
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...payload
  };
  users.push(user);
  return user;
}
