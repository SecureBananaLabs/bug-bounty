import { env } from "../config/env.js";

const users = [];

export async function listUsers() {
  return users.map(({ password: _pw, passwordHash: _ph, ...safe }) => safe);
}

export async function createUser(payload) {
  const { id: _id, password, ...rest } = payload;
  // TODO: hash password with bcrypt before storing
  const user = { id: `usr_${Date.now()}`, ...rest };
  users.push(user);
  const { password: _pw, passwordHash: _ph, ...safeUser } = user;
  return safeUser;
}
