const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { id: _ignoredId, ...clientFields } = payload ?? {};
  const user = { ...clientFields, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
