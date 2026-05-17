const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, flags: {}, ...payload };
  users.push(user);
  return user;
}

export async function findUser(id) {
  return users.find(u => u.id === id) || null;
}

export async function updateUser(id, data) {
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...data };
  return users[idx];
}
