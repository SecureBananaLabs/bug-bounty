const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { id: _ignoredId, ...userFields } = payload;
  const user = { id: `usr_${Date.now()}`, ...userFields };
  users.push(user);
  return user;
}
