const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
import { prisma } from "@packages/db";

export async function listUsers() {
  return await prisma.user.findMany();
}

export async function createUser(userData) {
  return await prisma.user.create({ data: userData });
}

export async function registerUser(registrationData) { /* Implementation would go here */ }
}
