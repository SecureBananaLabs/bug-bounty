const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { ...payload, id: `usr_${Date.now()}`, createdAt: new Date().toISOString() };
  users.push(user);
  return user;
}
