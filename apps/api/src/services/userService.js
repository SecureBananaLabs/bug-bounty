let users = [];

export async function listUsers() {
  return [...users];
}

export async function getUserById(id) {
  return users.find((u) => u.id === id) || null;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}

export function _resetUsers() {
  users = [];
}
