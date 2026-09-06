import { generateId } from '../utils/id.js';

const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: generateId('usr_'), ...payload };
  users.push(user);
  return user;
}

