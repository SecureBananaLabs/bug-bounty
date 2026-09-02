const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { id: _ignoredId, ...data } = payload || {};
  const user = { ...data, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
