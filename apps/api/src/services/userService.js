const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload, createdAt: new Date().toISOString() };
  users.push(user);
  return user;
}
